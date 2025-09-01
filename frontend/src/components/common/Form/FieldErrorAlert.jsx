import { Alert, AlertDescription } from '@/components/ui/alert'
import { FaExclamationTriangle } from 'react-icons/fa'

function FieldErrorAlert ({ errors, fieldName }) {
  if (!errors || !errors(fieldName )) return null

  return (
    <Alert
      variant="destructive"
      className="mt-2 overflow-hidden flex items-start gap-2"
    >
      <FaExclamationTriangle />
      <AlertDescription>
        {errors[fieldName]?.message}
      </AlertDescription>
    </Alert>
  )
}

export default FieldErrorAlert