import { createToken, EmbeddedActionsParser, Lexer } from 'chevrotain';
import { log } from '../../logger';
import infoDb from './infoDb';

const Info = createToken({ name: 'Info', pattern: /info/i });
const ShowInfo = createToken({ name: 'ShowInfo', pattern: /showInfo/i });
const NewLine = createToken({
  name: 'NewLine',
  pattern: /\r?\n/,
});
const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

const allTokens = [NewLine, WhiteSpace, ShowInfo, Info];
const InfoLexer = new Lexer(allTokens);

class InfoParser extends EmbeddedActionsParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public reset(): void {
    super.reset();
    infoDb.clear();
  }

  public diagram = this.RULE('diagram', () => {
    this.MANY(() => {
      this.CONSUME(NewLine);
    });
    this.SUBRULE(this.hdr);
    this.MANY2(() => {
      this.SUBRULE2(this.row);
    });
    this.ACTION(() => infoDb.setInfo(true));
    this.MANY3(() => {
      this.CONSUME2(NewLine);
    });
  });

  public hdr = this.RULE('hdr', () => {
    this.CONSUME(Info);
    this.OPTION(() => this.CONSUME(NewLine));
  });

  public row = this.RULE('row', () => {
    this.SUBRULE(this.field);
    this.MANY(() => {
      this.CONSUME(NewLine);
    });
  });

  public field = this.RULE('field', () => {
    this.CONSUME(ShowInfo);
    this.ACTION(() => infoDb.setInfo(true));
  });
}

const parser = new InfoParser();

const parse = (text: string): void => {
  const lexResult = InfoLexer.tokenize(text);
  parser.input = lexResult.tokens;
  parser.diagram();

  if (parser.errors.length > 0 || lexResult.errors.length > 0) {
    log.error(
      { parserErrors: parser.errors, lexerErrors: lexResult.errors },
      'Error parsing info diagram'
    );
    throw new Error(`Parser errors: ${parser.errors} Lex errors: ${lexResult.errors}`);
  }
};

export default { parser: {}, parse };
