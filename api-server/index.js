const express = require('express');
const { generateSlug } = require('random-word-slugs')
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs')

const app = express()
const PORT = 9000

const ecsClient = new ECSClient({
    region:'ap-south-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const config = {
    CLUSTER: 'arn:aws:ecs:ap-south-1:637423382602:cluster/builder-cluster-vercel',
    TASK: 'arn:aws:ecs:ap-south-1:637423382602:task-definition/builder-task'
}

app.use(express.json)
app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body;
    const projectSlug = slug ? slug : generateSlug();

    console.log('projectSlug', projectSlug)
    console.log('gitURL', gitURL)
    
    const command=new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: ['subnet-00f89b9b513d92498', 'subnet-01a0967ac0f71f3a0', 'subnet-01a04459c3c7c448d'],
                securityGroups: ['sg-0823f16f15ee5e0a3']
            }
        },
        overrides: {
            containerOverrides:[
                {
                    name: 'builder-image',
                    environment: [
                        { name: 'GIT_REPOSITORY__URL', value: gitURL},
                        { name: 'PROJECT_ID', value: projectSlug}
                    ]
                }
            ]
        }
    })

    await ecsClient.send(command);

    return res.json({ status: 'queued', data: {projectSlug, url: `http://${projectSlug}.localhost:8000`}})

})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))