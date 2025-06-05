import React from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'
import useProject from '~/hooks/use-project'
import { askQuestion } from './actions'
import { readStreamableValue } from 'ai/rsc'
import MDEditor from '@uiw/react-md-editor'
import CodeReferences from './code-references'
import { Progress } from '~/components/ui/progress'
import { api } from '~/trpc/react'
import { toast } from 'sonner'
import useRefetch from '~/hooks/user-refetch'


const AskQuestionCard = () => {
  const saveAnswer = api.project.saveAnswer.useMutation()
    const {project} = useProject()
    const [open, setOpen] = React.useState(false)
    const [question, setQuestion] = React.useState('')

    const [loading, setLoading] = React.useState(false)
    const [filesReferences, setFilesReferences] = React.useState<{fileName: string; sourceCode: string; summary: string; similarity: number;}[]>([])

    const [answer, setAnswer] = React.useState('')

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setAnswer('')
        setFilesReferences([])
        e.preventDefault()
        setLoading(true)
        
        const {output, filesReferences } = await askQuestion(question, project!.id)

        setOpen(true)
        setFilesReferences(filesReferences)

        for await (const chunk of readStreamableValue(output)){
            if (chunk){
                setAnswer((ans) => ans + chunk)
            }
        }

        setLoading(false)
    }

    const refetch = useRefetch()
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className='sm:max-w-[80vm]'>
          <DialogHeader>
            <div className='flex items-center gap-2'>
                <DialogTitle>Thinking...</DialogTitle>
                <Button disabled={saveAnswer.isPending} variant={'outline'} onClick={() => saveAnswer.mutate({
                    projectId: project!.id,
                    question,
                    answer,
                    filesReferences
                }, {
                    onSuccess: () => {
                        toast.success('Answer saved successfully')
                        refetch()
                    },
                    onError: () => {
                        toast.error('Failed to save answer')
                    }
                })}>
                  Save Answer
                </Button>
            </div>
          </DialogHeader>
                <MDEditor.Markdown source={answer} className='max-w-[70vm] !h-full max-h-[40vh] overflow-scroll rounded-md'/>
                <div className='h-4'></div>
                <CodeReferences filesReferences={filesReferences}/>
                <Button type='button' onClick={() => setOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader>
                <CardTitle>
                    Ask a question
                </CardTitle>
        </CardHeader>
        <CardContent>
                <form onSubmit={onSubmit}>
                    <Textarea placeholder='What do you want to know about the codebase?' value={question} onChange={(e) => setQuestion(e.target.value)} />
                    <div className='h-4'></div>
                    <Button type='submit' disabled={loading}>Ask Gitas</Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

export default AskQuestionCard

