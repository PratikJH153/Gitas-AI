import { api } from '~/trpc/react';
import { useLocalStorage } from 'usehooks-ts';

const useProject = () => {
    const {data:projects} = api.project.getAllProjects.useQuery();
    const [projectId, setProjectId] = useLocalStorage<string | null>('gitas-projectId', '');

    const project = projects?.find((project) => project.id === projectId);

    return {
        project,
        setProjectId,
        projectId,
        projects
    }
}

export default useProject

