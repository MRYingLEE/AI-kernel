// The chat format terms are based on ones of ChatGPT

// import { ChatMessage } from '@azure/openai';

import { user } from './user';
import { MyConsole } from './controlMode';

import Handlebars from 'handlebars/lib/handlebars';
import { ICodeSnippet } from 'jupyterlite-prompts';

// To render a template to real message to be sent ======================
function renderTemplate(
  snippet: ICodeSnippet,
  //   f_template: HandlebarsTemplateDelegate<any> | undefined,
  statuses: { [key: string]: string }
): string {
  // MyConsole.table(statuses);
  const template = snippet.code;
  const new_statuses = statuses;
  new_statuses['self_introduction'] = user.current_user.self_introduction();
  new_statuses['self'] = user.current_user.self_introduction();
  // MyConsole.table(new_statuses);
  let content = template;

  if (snippet.templateEngine === 'Handlebars') {
    try {
      // if (!(f_template === undefined)) {
      //   MyConsole.debug('content before f_userTemplate', content);
      //   content = f_template(new_statuses);
      //   MyConsole.debug('content after f_userTemplate', content);
      // } else {
      const f_template = Handlebars.compile(template);
      content = f_template(new_statuses);
    } catch {
      for (const key in new_statuses) {
        content = content.replace('{{' + key + '}}', new_statuses[key]);
        //   }
      }
      MyConsole.debug('Template:', template);
    }
  }

  // MyConsole.debug('content:', content);
  return content;
}

export function renderUserTemplate(
  snippet: ICodeSnippet,
  statuses: { [key: string]: string }
): string {
  return statuses['cell_text'] || '';
}

export function renderSysTemplate(
  snippet: ICodeSnippet,
  statuses: { [key: string]: string }
): string {
  return renderTemplate(snippet, statuses);
}
