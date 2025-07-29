// src/shared/sql.d.ts
declare module "sql.js" {
  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): QueryExecResult[];
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }

  interface Statement {
    bind(values?: any[]): boolean;
    step(): boolean;
    getAsObject(params?: any): any;
    get(params?: any): any[];
    run(values?: any[]): void;
    free(): boolean;
    reset(): void;
  }

  interface QueryExecResult {
    columns: string[];
    values: any[][];
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  function initSqlJs(config?: any): Promise<SqlJsStatic>;
  export default initSqlJs;
}
