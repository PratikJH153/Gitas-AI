'use client'
import React from 'react'
import { Button } from '~/components/ui/button';
import { useForm } from 'react-hook-form';
import { Input } from '~/components/ui/input';
import { api } from '~/trpc/react';
import { toast } from 'sonner';
import useRefetch from '~/hooks/user-refetch';


type FormInput = {
    repoUrl: string;
    projectName: string;
    githubToken?: string;
}

const CreatePage = () =>{
    const {register, handleSubmit, reset} = useForm<FormInput>();
    const createProject = api.project.createProject.useMutation(); 
    const refetch = useRefetch();
    
    const onSubmit = (data: FormInput) => {
        console.log(JSON.stringify(data));
        //window.alert(JSON.stringify(data));

        createProject.mutate({
            name: data.projectName,
            githubUrl: data.repoUrl,
            githubToken: data.githubToken
        }, {
            onSuccess: () => {
                toast.success('Project created successfully');
                refetch();
                reset();
            },
            onError: (error) => {
                toast.error('');
            }
        });
        return true;
    }
    
    return (
        <div className='flex items-center gap-12 h-full justify-center'>
            <img src="/undraw_github.svg" className="h-56 w-auto" />
            <div>
                <div>
                    <h1 className='font-semibold text-2xl'>
                        Link your GitHub repository
                    </h1>
                    <p className='text-sm text-muted-foreground'>
                        Enter the URL of your GitHub repository to link it to Gitas.
                    </p>
                </div>
                <div className='h-4'></div>
                <div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Input {...register('projectName', {required: true})} placeholder="Project Name" required/>
                        <div className='h-2'></div>
                        <Input {...register('repoUrl', {required: true})} placeholder="Repository URL" required/>
                        <div className='h-2'></div>
                        <Input {...register('githubToken')} placeholder="GitHub Token (Optional)"/>
                        <div className='h-4'></div>
                        <Button type="submit" disabled={createProject.isPending}>{createProject.isPending ? 'Creating...' : 'Create Project'}</Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default CreatePage
