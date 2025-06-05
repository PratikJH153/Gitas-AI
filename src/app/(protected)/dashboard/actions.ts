'use server'

import {streamText} from 'ai';
import {createStreamableValue} from 'ai/rsc';
import {createGoogleGenerativeAI, google} from '@ai-sdk/google';
import { generateEmbedding } from '~/lib/gemini';
import { db } from '~/server/db';

const genAI = createGoogleGenerativeAI({apiKey: process.env.GEMINI_API_KEY!});

export async function askQuestion(question:string, projectId: string){
    const stream = createStreamableValue()
  
    const queryVector = await generateEmbedding(question);
    const vectorQuery = `[${queryVector.join(',')}]`

    const result = await db.$queryRaw`
      SELECT "fileName", "sourceCode", "summary",
      1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS "similarity"
      FROM "SourceCodeEmbedding"
      WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.3
      AND "projectId" = ${projectId}
      ORDER BY "similarity" DESC
      LIMIT 10
    ` as {
      fileName: string;
      sourceCode: string;
      summary: string;
      similarity: number;
    }[]

    let context = ''

    for (const doc of result){
        context += `source: ${doc.fileName}\n\n code content: ${doc.sourceCode}\n\nsummary of file: ${doc.summary}\n\n`
    }

    (async ()=>{
        const {textStream} =  streamText({
          model: genAI('gemini-2.0-flash-exp'),
            prompt: `
            You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern who is looking to understand the codebase, its structure, logic, and functionality.

The AI assistant is a powerful, human-like artificial intelligence trained on software engineering best practices. The traits of AI include expert-level programming knowledge, clear and structured communication, problem-solving abilities, and articulate explanations.

AI is a well-mannered, respectful, and patient mentor. AI always responds in a friendly, supportive tone—never condescending. It explains concepts as if teaching a junior developer or intern.

AI always:
- Provides accurate, bug-free code.
- Explains code step-by-step.
- Clarifies any assumptions.
- Includes comments in code snippets for better understanding.
- Warns about potential edge cases or performance issues.
- Suggests improvements where applicable.

AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.

If the context does not provide the answer to the question, the AI assistant will say:  
"I'm sorry, but I don’t know the answer based on the provided context."

AI assistant will not apologize for previous responses but may indicate if new information was gained.

AI assistant will not invent anything that is not drawn directly from the context.

Answer in **markdown syntax**, with **code snippets** if needed. Be as detailed as possible when answering. Mention file names and function names where relevant.

Avoid unnecessary jargon unless it is clearly explained. Assume the intern has limited experience and offer additional clarification or links to documentation where helpful.

---

START CONTEXT BLOCK  
${context}  
END OF CONTEXT BLOCK  

START QUESTION  
${question}  
END OF QUESTION

            `
        })
        for await (const chunk of textStream) {
            stream.update(chunk)
        }
  
        stream.done()
    })()


    return {
      output: stream.value,
      filesReferences: result
  }
}