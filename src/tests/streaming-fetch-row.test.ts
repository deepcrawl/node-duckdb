import { ConnectionWrapper, DuckDB, DuckDBClass } from "../index";

const query = "SELECT count(*) FROM read_csv_auto('src/tests/test-fixtures/web_page.csv')";

describe("Streaming capability", () => {
  let db: DuckDBClass;
  let cw: ConnectionWrapper;
  beforeEach(() => {
    db = new DuckDB();
    cw = new ConnectionWrapper(db);
  });

  it("gracefully handles inactive stream", async () => {
    const rw1 = await cw.executeIterator(query, false);
    const rw2 = await cw.executeIterator(query, false);

    expect(() => rw1.fetchRow()).toThrow(
      "No data has been returned (possibly stream has been closed: only one stream can be active on one connection at a time)",
    );
    expect(rw2.fetchRow()).toEqual([60]);
  });

  it("gracefully handles inactive stream - second query is materialized", async () => {
    const rw1 = await cw.executeIterator(query, false);
    const rw2 = await cw.executeIterator(query, true);

    expect(() => rw1.fetchRow()).toThrow(
      "No data has been returned (possibly stream has been closed: only one stream can be active on one connection at a time)",
    );
    expect(rw2.fetchRow()).toEqual([60]);
  });

  it("works fine if done one after another", async () => {
    const rw1 = await cw.executeIterator(query, false);
    expect(rw1.fetchRow()).toEqual([60]);
    const rw2 = await cw.executeIterator(query, false);
    expect(rw2.fetchRow()).toEqual([60]);
  });

  it("is able to close - throws error when reading from closed result", async () => {
    const rw1 = await cw.executeIterator("SELECT * FROM read_csv_auto('src/tests/test-fixtures/web_page.csv')");
    expect(rw1.fetchRow()).toBeTruthy();
    rw1.close();
    expect(rw1.isClosed).toBe(true);
    expect(() => rw1.fetchRow()).toThrow("Result closed");
  });
});
