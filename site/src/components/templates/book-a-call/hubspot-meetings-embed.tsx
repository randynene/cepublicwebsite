export interface HubSpotMeetingsEmbedProps {
  url: string
  className?: string
}

/** HubSpot meetings inline iframe (Anto book-a-call page uses this, not Calendly). */
export function HubSpotMeetingsEmbed({ url, className }: HubSpotMeetingsEmbedProps) {
  const embedUrl = url.includes('embed=true') ? url : `${url}${url.includes('?') ? '&' : '?'}embed=true`

  return (
    <iframe
      title="Schedule a meeting"
      src={embedUrl}
      className={className}
      style={{ minWidth: 320, width: '100%', height: 700, border: 0 }}
    />
  )
}
