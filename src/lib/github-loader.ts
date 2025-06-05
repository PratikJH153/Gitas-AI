import {GithubRepoLoader} from "@langchain/community/document_loaders/web/github";
import {Document} from "@langchain/core/documents";
import { generateEmbedding, summarizeCode } from "./gemini";
import { db } from "~/server/db";


export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
    const loader = new GithubRepoLoader(githubUrl,{
        accessToken: githubToken || '',
        branch: 'main',
        ignoreFiles: ['node_modules', 'dist', 'build', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'],
        recursive: true,
        unknown: 'warn',
        maxConcurrency: 5,
    })

    const docs = await loader.load();
    return docs;
}

export const indexGitHubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken);

    const allEmbeddings = await generateEmbeddings(docs);

    await Promise.allSettled(allEmbeddings.map(async (embedding, index) => {
        console.log(`processing file ${index}`);
        if (!embedding) {
            console.log(`skipping file ${index}`);
            return;
        }
        
        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
            data: {
                projectId,
                fileName: embedding.fileName,
                sourceCode: embedding.sourceCode,
                summary: embedding.summary,
            }
        })

        await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${embedding.embedding}::vector
        WHERE "id" = ${sourceCodeEmbedding.id}
        `
        
    }));
    
}

const generateEmbeddings = async (docs: Document[]) => {
    return await Promise.all(docs.map(async doc => {
        const summary = await summarizeCode(doc);
        const embedding = await generateEmbedding(summary);
        return {
            summary,
            embedding,
            sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
            fileName: doc.metadata.source
        }
    }))
}


