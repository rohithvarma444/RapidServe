interface DeploymentStatus {
  status: string;
  message?: string;
  url?: string | null;
  error?: string | null;
}

export class StatusPoller {
    private intervalId: number | null = null;
    private deploymentId: string;
    private onStatusUpdate: (status: DeploymentStatus) => void;

    constructor(deploymentId: string, onStatusUpdate: (status: DeploymentStatus) => void) {
        this.deploymentId = deploymentId;
        this.onStatusUpdate = onStatusUpdate;
    }

    start() {
        this.pollStatus();
        
        this.intervalId = setInterval(() => {
            this.pollStatus();
        }, 60000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private async pollStatus() {
        try {
            console.log('Polling status for deployment ID:', this.deploymentId);
            const response = await fetch(`http://localhost:3000/status?id=${this.deploymentId}`);
            const status: DeploymentStatus = await response.json();
            console.log('Status response:', status);
            this.onStatusUpdate(status);
        } catch (error) {
            console.error('Error polling status:', error);
        }
    }
}
