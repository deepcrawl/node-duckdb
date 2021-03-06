import { Readable } from "stream";

import { Connection, DuckDB } from "@addon";
import { IExecuteOptions, RowResultFormat } from "@addon-types";

const query = "SELECT * FROM read_csv_auto('src/tests/test-fixtures/web_page.csv')";

const executeOptions: IExecuteOptions = { rowResultFormat: RowResultFormat.Array };

function readStream<T>(rs: Readable): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const elements: T[] = [];
    rs.on("data", (el: any) => elements.push(el));
    rs.on("error", reject);
    rs.on("end", () => resolve(elements));
  });
}

describe("Result stream", () => {
  let db: DuckDB;
  let connection: Connection;
  beforeEach(() => {
    db = new DuckDB();
    connection = new Connection(db);
  });

  afterEach(() => {
    connection.close();
    db.close();
  });

  it("reads a csv", async () => {
    const rs = await connection.execute(query, executeOptions);
    const elements = await readStream(rs);
    expect(elements.length).toBe(60);
    expect(elements[0]).toEqual([
      1,
      "AAAAAAAABAAAAAAA",
      "1997-09-03",
      null,
      2450810,
      2452620,
      "Y",
      98539,
      "http://www.foo.com",
      "welcome",
      2531,
      8,
      3,
      4,
    ]);
  });

  it("is able to read from two streams sequentially", async () => {
    const rs1 = await connection.execute(query, executeOptions);
    const elements1 = await readStream(rs1);
    expect(elements1.length).toBe(60);

    const rs2 = await connection.execute(query, executeOptions);
    const elements2 = await readStream(rs2);
    expect(elements2.length).toBe(60);
  });

  it("correctly handles errors - closes resource", async () => {
    const rs1 = await connection.execute(query, executeOptions);
    await connection.execute(query, executeOptions);
    let hasClosedFired = false;
    rs1.on("close", () => (hasClosedFired = true));
    await expect(readStream(rs1)).rejects.toMatchObject({
      message:
        "Attempting to fetch from an unsuccessful or closed streaming query result: only one stream can be active on one connection at a time)",
    });
    expect(hasClosedFired).toBe(true);
  });

  it("is able to read from two streams on separate connections to one database while interleaving", async () => {
    const connection1 = new Connection(db);
    const connection2 = new Connection(db);
    const rs1 = await connection1.execute(query, executeOptions);
    const rs2 = await connection2.execute(query, executeOptions);

    const elements1 = await readStream(rs1);
    expect(elements1.length).toBe(60);

    const elements2 = await readStream(rs2);
    expect(elements2.length).toBe(60);
  });

  // TODO: We probably want to stop queries when we close connection?
  it("is able to close - in prorgess queries run to the end", async () => {
    const query1 = "CREATE TABLE test (a INTEGER, b INTEGER);";
    const query2 =
      "INSERT INTO test SELECT a, b FROM (VALUES (11, 22), (13, 22), (12, 21)) tbl1(a,b), repeat(0, 5000) tbl2(c)";
    await connection.execute(query1, executeOptions);
    const p = connection.execute(query2, executeOptions);
    connection.close();
    const elements = await readStream(await p);
    expect(elements).toEqual([[15000n]]);
  });
});
