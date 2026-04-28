import { NotFoundPage } from '@/components/shared/NotFoundPage'
import trMessages from '@/i18n/messages/tr.json'

export default function RootNotFound() {
  return <NotFoundPage copy={trMessages.notFound} homeHref="/tr" menuHref="/tr/menu" />
}
