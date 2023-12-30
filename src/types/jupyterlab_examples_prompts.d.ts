// jupyterlab_examples_prompts.d.ts
declare module 'jupyterlab_examples_prompts' {
    export interface ICodeSnippet {
        name: string;
        description?: string;
        language: string;
        code: string;
        id: number;
        tags?: string[];
        templateEngine?: '' | 'f-string' | 'jinja2' | 'Handlebars' | 'ejs';
        voiceName?: string;
        iconURL?: string;
    }
    export declare class CodeSnippetService {
        private settingManager;
        private static codeSnippetService;
        private codeSnippetList;
        private constructor();
        private convertToICodeSnippetList;
        private static getCodeSnippetService;
        static initCodeSnippetService(settings: Settings, app: JupyterFrontEnd): Promise<void>;
        static load(contents: ContentsManager, folderPath: string): Promise<void>;
        static get settings(): Settings;
        static get snippets(): ICodeSnippet[];
        static getSnippetByName(snippetName: string): ICodeSnippet[];
        static getUniqueSnippetByName(snippetName: string): ICodeSnippet;
        static addSnippet(snippet: ICodeSnippet): Promise<boolean>;
        static addSnippet_internal(snippet: ICodeSnippet): Promise<boolean>;
        static deleteSnippet(id: number): Promise<boolean>;
        static renameSnippet(oldName: string, newName: string): Promise<boolean>;
        static duplicatedName(newName: string): boolean;
        static modifyExistingSnippet(oldName: string, newSnippet: ICodeSnippet): Promise<boolean>;
        static moveSnippet(fromIdx: number, toIdx: number): Promise<boolean>;
        static orderSnippets(): Promise<boolean>;
        static orderSnippets_internal(globalService: CodeSnippetService): Promise<boolean>;
    }    
  }