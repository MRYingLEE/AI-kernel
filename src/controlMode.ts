export class MyConsole {
  static inDebug = false;
  static log(...data: any[]): void {
    if (MyConsole.inDebug) {
      console.log(data);
    }
  }
  static debug(...data: any[]): void {
    if (MyConsole.inDebug) {
      console.info(data);
    }
  }
  static info(...data: any[]): void {
    if (MyConsole.inDebug) {
      console.info(data);
    }
  }
  static error(...data: any[]): void {
    if (MyConsole.inDebug) {
      console.error(data);
    }
  }

  static table(tabularData?: any, properties?: string[] | undefined): void {
    if (MyConsole.inDebug) {
      console.table(tabularData, properties);
    }
  }

  static warn(stdout: any[]): void {
    if (MyConsole.inDebug) {
      console.warn(stdout);
    }
  }
}
// To do rate limit control
