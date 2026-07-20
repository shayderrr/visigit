import { useGitData } from './hooks/useGitData'
import DropZone from './components/DropZone'
import Dashboard from './components/Dashboard'
import LoadingScreen from './components/LoadingScreen'
import SnowBackground from './components/SnowBackground'

export default function App() {
  const { data, loading, error, progress, openFolder, loadFromInput } = useGitData()

  if (loading) {
    return (
      <div className="relative w-full h-full">
        <SnowBackground />
        <LoadingScreen progress={progress} />
      </div>
    )
  }

  if (!data) {
    return <DropZone onSelect={loadFromInput} onBrowse={openFolder} error={error} />
  }

  return <Dashboard data={data} onReset={() => window.location.reload()} />
}
