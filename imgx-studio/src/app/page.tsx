import { ImageStudio } from "@/components/image-studio"
import { DEFAULT_LOCALE } from "@/lib/i18n"

export default function Home() {
  return <ImageStudio initialLocale={DEFAULT_LOCALE} />
}
