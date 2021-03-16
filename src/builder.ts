type LineFeed = 
  /** unix default new line */
  | "\n"
  /** carriage return */
  | "\r\n"

export interface IAddLineOptions {
  /** level of indentation, will create this number of tabs, defaults to 0 */
  indent?: number;
  /** line feed to end line, default is new line "\n" (unix default)
   * set to empty string ("") to not add a closing line feed
   */
  lf?: LineFeed;
  /** include default prefix */
  includePrefix?: boolean;
}

const DEFAULT_OPTIONS: IAddLineOptions = { 
  indent: 0,  
  includePrefix: true 
}


/**
 * string builder class helper
 */
export class StringBuilder {
  /** the configured tab size */
  public tabSize: number;
  /** number for start character index (leading whitespace length) */
  private startCharIndex: number;
  /** the line feed type */
  public defaultLF: LineFeed;
  private _text = ''
  // public lineCount = 0

  constructor(startCharIndex=0, tabSize=2, defaultLF: LineFeed = '\n'){
    this.startCharIndex = startCharIndex
    this.tabSize = tabSize
    this.defaultLF = defaultLF
  }

  get prefix(): string {
    return ' '.repeat(this.startCharIndex)
  }

  get tab(): string {
    return ' '.repeat(this.tabSize)
  }

  get text(): string {
    return this._text
  }

  get lineCount(): number {
    return this.text.length ? this.text.split('\n').length: 0
  }

  indent(level=1): string {
    return this.tab.repeat(level)
  }

  /**
   * adds a line to the string builder
   * @param content - the content to add
   * @param options - options for adding line 
   */
  addLine(content: string, options?: IAddLineOptions){
    const { includePrefix, lf, indent } = {...DEFAULT_OPTIONS, ...options }
    this._text += includePrefix && this.lineCount ? this.prefix: ''
    this._text += this.indent(indent)
    this._text += content
    this._text += this.defaultLF
      
  }

  // appends text to string builder
  appendText(content: string){
    this._text += content
  }

}