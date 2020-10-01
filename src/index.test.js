describe("node-duckdb", () => {
  it("exports a ConnectionWrapper", () => {
    const { ConnectionWrapper } = require(".");

    expect(ConnectionWrapper).not.toBe(undefined);
  });

  describe("ConnectionWrapper", () => {
    it("can be instantiated", () => {
      const { ConnectionWrapper } = require(".");
      const cw = new ConnectionWrapper();

      expect(cw).toBeInstanceOf(ConnectionWrapper);
    });

    describe("execute()", () => {
      it("validates parameters", () => {
        const { ConnectionWrapper } = require(".");
        const cw = new ConnectionWrapper();

        expect(() => cw.execute()).toThrow("String expected");
      });

      it("returns a ResultWrapper", () => {
        const { ConnectionWrapper, ResultWrapper } = require(".");
        const cw = new ConnectionWrapper();

        const rw = cw.execute("SELECT 1");

        expect(rw).toBeDefined();
        expect(rw).toBeInstanceOf(ResultWrapper);
      });

      it("returns a ResultWrapper", () => {
        const { ConnectionWrapper, ResultWrapper } = require(".");
        const cw = new ConnectionWrapper();

        const rw = cw.execute("SELECT 1");

        expect(rw).toBeDefined();
        expect(rw).toBeInstanceOf(ResultWrapper);
      });

      it("can do a csv scan", () => {
        const { ConnectionWrapper, ResultWrapper } = require(".");
        const cw = new ConnectionWrapper();

        const rw = cw.execute(
          "SELECT count(*) FROM read_csv_auto('duckdb/test/sql/copy/csv/test_web_page.test')"
        );

        expect(rw.fetchRow()).toMatchObject([38]);
        expect(rw.fetchRow()).toBe(null);
      });
    });
  });

  describe("ResultWrapper", () => {
    describe("description()", () => {
      it("errors when without a result", () => {
        const { ResultWrapper } = require(".");
        const rw = new ResultWrapper();

        expect(rw).toBeInstanceOf(ResultWrapper);

        expect(() => rw.describe()).toThrow("Result closed");
      });

      it("can read column names", () => {
        const { ConnectionWrapper } = require(".");
        const cw = new ConnectionWrapper();
        const rw = cw.execute(`SELECT 
          null AS c_null,
          0,
          'something',
          'something' AS something
        `);

        expect(rw.describe()).toMatchObject([
          ["c_null", "INTEGER"],
          ["0", "INTEGER"],
          ["something", "VARCHAR"],
          ["something", "VARCHAR"],
        ]);
      });
    });

    describe("fetchRow()", () => {
      it("errors when without a result", () => {
        const { ResultWrapper } = require(".");
        const rw = new ResultWrapper();

        expect(rw).toBeInstanceOf(ResultWrapper);

        expect(() => rw.fetchRow()).toThrow("Result closed");
      });

      it("can read a single record containing all types", () => {
        const { ConnectionWrapper, ResultWrapper } = require(".");
        const cw = new ConnectionWrapper();
        const rw = cw.execute(`SELECT 
          null,
          true,
          0,
          CAST(1 AS TINYINT),
          CAST(8 AS SMALLINT),
          10000,
          9223372036854775807,
          1.1,        
          CAST(1.1 AS DOUBLE),
          'stringy',
          TIMESTAMP '1971-02-02 01:01:01.001',
          DATE '1971-02-02',
          TIME '01:01:01.001'
        `);

        expect(rw.fetchRow()).toMatchObject([
          null,
          true,
          0,
          1,
          8,
          10000,
          9223372036854776000, // Note: not a BigInt (yet)
          1.1,
          1.1,
          "stringy",
          Date.UTC(71, 1, 2, 1, 1, 1, 1),
          Date.UTC(71, 1, 2),
          1 + 1000 + 60000 + 60000 * 60,
        ]);
      });
    });
  });
});
