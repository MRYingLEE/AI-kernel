import { getPossibleElementByQuerySelector, getBefores } from './utils.js'
// import { promptSettings } from './prompt-configs.js'

import { getTimestamp } from 'swr/_internal';
import { coreMessage,promptTemplates, promptTemplate } from './Ying/promptTemplate'

//  todo:  Now only CODE cell is supported, we need to make it support MARKDOWN cell also!!

function get_focal_data(siteName: string): [string, string, string, string, string] {
    let focalCell = null
    let codeLines = null
    let stderr = null
    let stdout = null
    let stdresult = null
    if (siteName === "notebook") {
        focalCell = getPossibleElementByQuerySelector<HTMLInputElement>([".cell.selected"])
        codeLines = document.querySelectorAll(".cell.selected div.input_area pre.CodeMirror-line")
        stderr = getPossibleElementByQuerySelector<HTMLInputElement>([".cell.selected div.output_area div.output_error"])
        stdout = getPossibleElementByQuerySelector<HTMLInputElement>([".cell.selected div.output_area div.output_stdout"])
        stdresult = getPossibleElementByQuerySelector<HTMLInputElement>([".cell.selected div.output_area div.output_result"])
    } else if (siteName === "lab") {
        const active_notebook = document.querySelector<HTMLInputElement>('div.jp-NotebookPanel:not(.p-mod-hidden)')
        if (active_notebook) {
            focalCell = active_notebook.querySelector<HTMLInputElement>(".jp-CodeCell.jp-mod-selected")
            codeLines = active_notebook.querySelectorAll<HTMLInputElement>(".jp-CodeCell.jp-mod-selected pre.CodeMirror-line")
            stderr = active_notebook.querySelector<HTMLInputElement>('.jp-CodeCell.jp-mod-selected div.jp-OutputArea-output[data-mime-type="application/vnd.jupyter.stderr"]')
            stdout = active_notebook.querySelector<HTMLInputElement>('.jp-CodeCell.jp-mod-selected div.jp-OutputArea-output[data-mime-type="application/vnd.jupyter.stdout"]')
            stdresult = active_notebook.querySelector<HTMLInputElement>('.jp-CodeCell.jp-mod-selected div.jp-OutputArea-output[data-mime-type="text/plain"]')
        } else {
            console.log("ChatGPT Jupyter: Warning - No active notebook panel found")
            return ["", "", "", "", ""]
        }
    } else {
        console.log("ChatGPT Jupyter: Warning - Unknown site name")
        return ["", "", "", "", ""]
    }

    console.log("focalCell:", focalCell);
    console.log("codeLines:", codeLines);
    console.log("stdout:", stdout);
    console.log("stdresult:", stdresult);
    console.log("stderr:", stderr);

    // Loop over codeLines and concatenate the textContent to code
    let focalcode_text = ""
    if (codeLines && codeLines.length > 0) {
        codeLines.forEach((line) => {
            if (line.textContent) {
                focalcode_text += line.textContent + "\n"
            }
        })
    }

    let cell_text = focalCell?.textContent || "";

    let stdout_text = stdout?.textContent || "";
    let result_text = stdresult?.textContent || "";
    let stderr_text = stderr?.textContent || "";

    console.log("cell_text:", cell_text);
    console.log("focalcode_text:", focalcode_text);
    console.log("stdout_text:", stdout_text);
    console.log("result_text:", result_text);
    console.log("stderr_text:", stderr_text);

    return [cell_text, focalcode_text, stdout_text, result_text, stderr_text];
}

function BuildMessages(
    templateName: string,
    siteName: string
    // ,    userInput?: string
): coreMessage[] {
    console.debug("Query0");
    // const prompt = promptSettings[templateName]

    /* -------------------------------------------------------------------------- */
    /*                    First get the data for the focal cell                   */
    /* -------------------------------------------------------------------------- */

    let [cell_text, focalcode_text, stdout_text, result_text, stderr_text] = get_focal_data(siteName);

    console.log("cell_text:", cell_text);
    console.log("focalcode_text:", focalcode_text);
    console.log("stdout_text:", stdout_text);
    console.log("result_text:", result_text);
    console.log("stderr_text:", stderr_text);

    //Ying: This is a bad idea to get the previous cells for the ranking of the cells have nothing to do with the real execution sequence.

    // /* -------------------------------------------------------------------------- */
    // /*                 Second, get the data for the previous cells                */
    // /* -------------------------------------------------------------------------- */


    // let befores
    // if (prompt.maxCharPrevCells > 0 && focalCell) {
    //     befores = getBefores(focalCell, [], 0, 9999)
    // }

    // let before_text_array : string[]= []
    // if (befores && befores.length > 0) {
    //     befores.forEach((before) => {
    //         const lines = before.querySelectorAll("pre.CodeMirror-line")
    //         if (lines && lines.length > 0) {
    //             let before_text = ""
    //             lines.forEach((line) => {
    //                 if (line.textContent) {
    //                     before_text += line.textContent + "\n"
    //                 }
    //             })
    //             before_text_array.push(before_text)
    //         }
    //     })
    // }

    // let prev_cell_text = ""
    // for (let i = before_text_array.length - 1; i >= 0; i--) {
    //     if ((prev_cell_text.length) < prompt.maxCharPrevCells) {
    //         prev_cell_text = before_text_array[i] + "\n" + prev_cell_text
    //     } else {
    //         break
    //     }
    // }

    // // Check if any of the last non-empty lines 3 of the prev_cell_text are headers
    // // If so, add the header to the start of the code cell and remove it from the prev_cell_text
    // // Stop when a non-header line is found
    // if (prev_cell_text.length > 0) {
    //     const last_lines = prev_cell_text.split("\n").slice(-20)

    //     let len_to_remove = 0
    //     for (let i = last_lines.length - 1; i >= 0; i--) {
    //         if (last_lines[i].length > 3) {
    //             if (last_lines[i].startsWith("#")) {
    //                 code_previous_focal = last_lines[i] + "\n" + code_previous_focal
    //                 len_to_remove += last_lines[i].length 
    //             } else {
    //                 break
    //             }
    //         } else {
    //             len_to_remove += last_lines[i].length + 1
    //         }
    //     }
    //     if (len_to_remove > 0) {
    //         prev_cell_text = prev_cell_text.slice(0, -len_to_remove)
    //     }
    // }

    // // Remove any excessive newlines in the prev_cell_text or code
    // prev_cell_text = prev_cell_text.replace(/\n{3,}/g, "\n\n")
    // code_previous_focal = code_previous_focal.replace(/\n{3,}/g, "\n\n")

    /* -------------------------------------------------------------------------- */
    /*             Get the STDOUT / Result / STDERR of the focal cell             */
    /* -------------------------------------------------------------------------- */


    /* -------------------------------------------------------------------------- */
    /*                 Third, build the query string and return it                */
    /* -------------------------------------------------------------------------- */

    // let query = "";
    // if (code_text || (type == "question" && userInput)) {
    //     if (type == "complete") {
    //         query = promptTemplates["complete"](/*prev_cell_text,*/ code_text)
    //     } else if (type == "explain") {
    //         query = promptTemplates["explain"](/*prev_cell_text,*/ code_text, stdout_text, result_text)
    //     } else if (type == "format") {
    //         query = promptTemplates["format"](code_text)
    //     } else if (type == "debug") {
    //         query = promptTemplates["debug"](/*prev_cell_text,*/ code_text, stderr_text)
    //     } else if (type == "review") {
    //         query = promptTemplates["review"](/*prev_cell_text,*/ code_text)
    //     } else {
    //         if (userInput) {
    //             query = promptTemplates["question"](userInput)
    //         } else {
    //             console.log("ChatGPT Jupyter: Error - No user input provided")
    //             return ""
    //         }
    //     }
    //     return query
    // } else {
    //     console.log("ChatGPT Jupyter: Error - No code found")
    //     return ""
    // }

    const statuses: { [key: string]: string; } = { "focalcode_text": focalcode_text, "stdout_text": stdout_text, "cell_text": focalcode_text }
    const template = promptTemplates[templateName];

    if (focalcode_text.toLowerCase().startsWith("/clear"))
        if (template!=null){
            template.startNewSession();
            return [];
        }

    if (template != null) {
        return template.buildTemplate(statuses);
    }
    else
        return [];
}

export { BuildMessages, get_focal_data };