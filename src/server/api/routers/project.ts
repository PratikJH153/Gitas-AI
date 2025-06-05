import { pullCommits } from "~/lib/github";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { indexGitHubRepo } from "~/lib/github-loader";

export const projectRouter = createTRPCRouter({
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional(),
            language: z.string().optional()
        })
    ).mutation( async ({ctx, input}) => {
        const project = await ctx.db.project.create({
            data: {
                githubUrl: input.githubUrl,
                name: input.name,
                language: input.language,
                userToProjects: {
                    create: {
                        userId: ctx.user.userId!,
                    }
                }
            }
        })
        await indexGitHubRepo(project.id, input.githubUrl, input.githubToken)
        await pullCommits(project.id);
        return project;
    }),
    getAllProjects: protectedProcedure.query(async ({ctx}) => {
        const projects = await ctx.db.project.findMany({
            where: {
                userToProjects: {
                    some: {
                        userId: ctx.user.userId!
                    }
                },
                deletedAt: null
            }
        })

        return projects;
    }),
    getCommits: protectedProcedure.input(
        z.object({
            projectId: z.string()
        })
    ).query(async ({ctx, input}) => {
        pullCommits(input.projectId).then().catch(console.error)
        const commits = await ctx.db.commit.findMany({
            where: {
                projectId: input.projectId
            }
        })
        return commits;
    }),
    saveAnswer: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            question: z.string(),
            answer: z.string(),
            filesReferences: z.any()
        })
    ).mutation(async ({ctx, input}) => {
        const answer = await ctx.db.question.create({
            data: {
                answer: input.answer,
                projectId: input.projectId,
                question: input.question,
                userId: ctx.user.userId!,
                fileReferences: input.filesReferences
            }
        })
        return answer;
    }),
    getQuestions: protectedProcedure.input(
        z.object({
            projectId: z.string()
        })
    ).query(async ({ctx, input}) => {
        const questions = await ctx.db.question.findMany({
            where: {
                projectId: input.projectId
            },
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return questions;
    })
});
