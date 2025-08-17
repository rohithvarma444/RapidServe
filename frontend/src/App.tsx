import { useState, useEffect } from 'react'
import { StatusPoller } from './statusPoller'
import './App.css'

interface DeploymentStatus {
  status: string;
  message?: string;
  url?: string | null;
  error?: string | null;
}

function App() {
  const [githubUrl, setGithubUrl] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null)
  const [backendUrl, setBackendUrl] = useState('')
  const [deploymentId, setDeploymentId] = useState('')
  const [statusPoller, setStatusPoller] = useState<StatusPoller | null>(null)

  const API_BASE = 'http://localhost:3000'

  const clearStatusPolling = () => {
    if (statusPoller) {
      statusPoller.stop()
      setStatusPoller(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!githubUrl.trim()) {
      alert('Please enter a GitHub URL')
      return
    }

    const githubUrlPattern = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+$/
    if (!githubUrlPattern.test(githubUrl.trim())) {
      alert('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)')
      return
    }

    clearStatusPolling()
    
    setIsDeploying(true)
    setDeploymentStatus(null)
    setBackendUrl('')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) 

      const response = await fetch(`${API_BASE}/repourl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl: githubUrl.trim() }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Server error: ${response.status}`)
      }

      const data = await response.json()
      const newDeploymentId = data.deploymentId
      setDeploymentId(newDeploymentId)
      setDeploymentStatus({ status: 'started', message: 'Deployment initiated successfully' })
      
      startStatusPolling(newDeploymentId)
      
    } catch (error) {
      console.error('Deployment error:', error)
      
      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - please try again'
        } else {
          errorMessage = error.message
        }
      }
      
      setDeploymentStatus({ 
        status: 'error', 
        message: errorMessage
      })
      setIsDeploying(false)
    }
  }

  const startStatusPolling = (deploymentIdToUse: string) => {
    console.log('Starting status polling with deployment ID:', deploymentIdToUse)
    
    const poller = new StatusPoller(deploymentIdToUse, (status: DeploymentStatus) => {
      console.log('Status update received:', status)
      setDeploymentStatus(status)
      
      if (status.status === 'completed') {
        const generatedUrl = `http://${deploymentIdToUse}.rapidserve.com:3001/index.html`
        setBackendUrl(generatedUrl)
        setIsDeploying(false)
        clearStatusPolling()
      } else if (status.status === 'failed' || status.status === 'error') {
        setIsDeploying(false)
        clearStatusPolling()
      }
    })
    
    setStatusPoller(poller)
    poller.start()
  }

  useEffect(() => {
    return () => {
      clearStatusPolling()
    }
  }, [])

  const getStatusColor = (status: string) => {
    if (!status) return '#ef4444'
    
    switch (status) {
      case 'completed': return '#10b981'
      case 'failed': 
      case 'error': 
      case 'timeout': return '#ef4444'
      case 'deploying': 
      case 'started': 
      case 'building': return '#f59e0b'
      default: return '#3b82f6'
    }
  }

  const getStatusBgColor = (status: string) => {
    if (!status) return '#fef2f2'
    
    switch (status) {
      case 'completed': return '#ecfdf5'
      case 'failed': 
      case 'error': 
      case 'timeout': return '#fef2f2'
      case 'deploying': 
      case 'started': 
      case 'building': return '#fefbeb'
      default: return '#eff6ff'
    }
  }

  const getStatusDisplay = (status: string) => {
    if (!status) return '❌ Error'
    
    switch (status) {
      case 'completed': return '✅ Completed'
      case 'failed': return '❌ Failed'
      case 'error': return '❌ Error'
      case 'timeout': return '⏰ Timeout'
      case 'deploying': return '🚀 Deploying'
      case 'started': return '🔄 Started'
      case 'building': return '🔨 Building'
      default: return `🔄 ${status}`
    }
  }

  const handleReset = () => {
    clearStatusPolling()
    setGithubUrl('')
    setIsDeploying(false)
    setDeploymentStatus(null)
    setBackendUrl('')
    setDeploymentId('')
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ 
        maxWidth: '700px', 
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '40px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '2.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 10px 0'
          }}>
            ⚡ RapidServe
          </h1>
          <p style={{ 
            color: '#6b7280',
            fontSize: '1.1rem',
            margin: '0'
          }}>
            Deploy your GitHub repositories instantly
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '25px' }}>
            <label htmlFor="githubUrl" style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.95rem'
            }}>
              🔗 GitHub Repository URL
            </label>
            <input
              type="url"
              id="githubUrl"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                outline: 'none',
                backgroundColor: '#ffffff'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = 'none'
              }}
              disabled={isDeploying}
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              type="submit"
              disabled={isDeploying}
              style={{
                background: isDeploying 
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isDeploying ? 'not-allowed' : 'pointer',
                flex: '1',
                transition: 'all 0.2s ease',
                boxShadow: isDeploying 
                  ? 'none' 
                  : '0 4px 15px rgba(102, 126, 234, 0.4)',
              }}
              onMouseOver={(e) => {
                if (!isDeploying) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                }
              }}
              onMouseOut={(e) => {
                if (!isDeploying) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              {isDeploying ? '🚀 Deploying...' : '🚀 Deploy Now'}
            </button>
            
            {(deploymentStatus || isDeploying) && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isDeploying}
                style={{
                  backgroundColor: isDeploying ? '#d1d5db' : '#f3f4f6',
                  color: isDeploying ? '#9ca3af' : '#374151',
                  padding: '16px 24px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isDeploying ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!isDeploying) {
                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                  }
                }}
                onMouseOut={(e) => {
                  if (!isDeploying) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }
                }}
              >
                🔄 Reset
              </button>
            )}
          </div>
        </form>

        {deploymentStatus && (
          <div style={{
            padding: '25px',
            border: `2px solid ${getStatusColor(deploymentStatus.status)}`,
            borderRadius: '16px',
            backgroundColor: getStatusBgColor(deploymentStatus.status),
            marginBottom: '25px',
            transition: 'all 0.3s ease'
          }}>
            <h3 style={{ 
              margin: '0 0 15px 0',
              color: '#1f2937',
              fontSize: '1.2rem',
              fontWeight: '600'
            }}>
              📊 Deployment Status
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(deploymentStatus.status),
                marginRight: '15px',
                boxShadow: `0 0 10px ${getStatusColor(deploymentStatus.status)}33`
              }}></div>
              <strong style={{ 
                fontSize: '1.1rem',
                color: '#1f2937'
              }}>
                {getStatusDisplay(deploymentStatus.status)}
              </strong>
            </div>
            {deploymentStatus.message && (
              <p style={{ 
                margin: '0',
                color: '#4b5563',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                💬 {deploymentStatus.message}
              </p>
            )}
            {deploymentStatus.error && (
              <p style={{ 
                margin: '10px 0 0 0',
                color: '#dc2626',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                ❌ Error: {deploymentStatus.error}
              </p>
            )}
          </div>
        )}

        {deploymentStatus?.status === 'completed' && (
          <div style={{
            padding: '30px',
            border: '2px solid #10b981',
            borderRadius: '16px',
            backgroundColor: '#ecfdf5',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              margin: '0 0 15px 0',
              color: '#047857',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              🎉 Deployment Complete!
            </h3>
            {backendUrl ? (
              <>
                <p style={{ 
                  margin: '0 0 20px 0',
                  color: '#065f46',
                  fontSize: '1.1rem'
                }}>
                  Your application is now live and ready to use:
                </p>
                <div style={{
                  padding: '15px',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #d1fae5'
                }}>
                  <a 
                    href={backendUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: '#1d4ed8',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      wordBreak: 'break-all',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = '#1e40af'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = '#1d4ed8'
                    }}
                  >
                    🌐 {backendUrl}
                  </a>
                </div>
                <button
                  onClick={() => window.open(backendUrl, '_blank')}
                  style={{
                    marginTop: '15px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  🚀 Visit Site
                </button>
              </>
            ) : (
              <p style={{ 
                margin: '0',
                color: '#065f46',
                fontSize: '1.1rem'
              }}>
                Deployment completed successfully! The application URL will be available shortly.
              </p>
            )}
          </div>
        )}

        <div style={{
          padding: '25px',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ 
            margin: '0 0 20px 0',
            color: '#1e293b',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            ℹ️ How it works:
          </h4>
          <ol style={{ 
            paddingLeft: '25px',
            margin: '0',
            lineHeight: '1.8'
          }}>
            <li style={{ marginBottom: '8px', color: '#475569' }}>
              <strong>Enter URL:</strong> Paste your GitHub repository URL
            </li>
            <li style={{ marginBottom: '8px', color: '#475569' }}>
              <strong>Deploy:</strong> Click the deploy button to start the process
            </li>
            <li style={{ marginBottom: '8px', color: '#475569' }}>
              <strong>Monitor:</strong> Watch real-time deployment status updates
            </li>
            <li style={{ marginBottom: '8px', color: '#475569' }}>
              <strong>Launch:</strong> Get your live application URL when complete
            </li>
            <li style={{ color: '#475569' }}>
              <strong>Reset:</strong> Use reset to start a fresh deployment
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default App
