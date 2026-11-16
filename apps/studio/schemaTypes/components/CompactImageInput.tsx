
import {useCallback, useRef} from 'react'
import {useClient, set, unset} from 'sanity'
import type {ObjectInputProps} from 'sanity'

const BTN: React.CSSProperties = {
  fontSize: 11,
  padding: '3px 10px',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 4,
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  lineHeight: 1.6,
}

type CompactImageInputProps = ObjectInputProps & {
  showCustomFields?: boolean
}

export default function CompactImageInput(props: CompactImageInputProps) {
  const {
    value,
    onChange,
    renderDefault,
    showCustomFields = false,
  } = props

  const client = useClient({apiVersion: '2024-01-01'})
  const {projectId, dataset} = client.config()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Build CDN thumbnail URL
  const assetRef: string | undefined = (value as any)?.asset?._ref

  let thumbUrl: string | null = null

  if (assetRef && projectId && dataset) {
    const m = assetRef.match(/^image-([^-]+)-(\d+x\d+)-(\w+)$/)

    if (m) {
      thumbUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}/${m[1]}-${m[2]}.${m[3]}?w=240&h=120&fit=max`
    }
  }

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      e.target.value = ''

      try {
        const asset = await client.assets.upload('image', file)

        onChange(
          set({
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id,
            },
          }),
        )
      } catch (err) {
        console.error('[CompactImageInput] upload failed', err)
      }
    },
    [client, onChange],
  )

  const handleRemove = useCallback(() => {
    onChange(unset())
  }, [onChange])

  // Image uploaded
  if (thumbUrl) {
    return (
      <div
        className={showCustomFields ? 'compact-image-with-fields' : undefined}
        style={{
          display: 'flex',
          flexDirection: showCustomFields ? 'column' : 'row',
          alignItems: 'flex-start',
          gap: 12,
          width: '100%',
        }}
      >
        {/* Compact thumbnail and actions */}
        <div style={{display: 'flex', alignItems: 'flex-start', gap: 12}}>
          <div
            style={{
              width: 120,
              height: 72,
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#0f172a',
              flexShrink: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={thumbUrl}
              alt=""
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              paddingTop: 4,
            }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={BTN}
            >
              Replace
            </button>

            <button
              type="button"
              onClick={handleRemove}
              style={{
                ...BTN,
                color: '#f87171',
                borderColor: 'rgba(239,68,68,0.3)',
              }}
            >
              Remove
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{display: 'none'}}
              onChange={handleFile}
            />
          </div>
        </div>

        {/* Show Sanity custom fields only when requested */}
        {showCustomFields && (
          <>
            <style>
              {`
                .compact-image-with-fields .compact-image-fields img {
                  display: none !important;
                }

                .compact-image-with-fields .compact-image-fields div:has(> img) {
                  display: none !important;
                }
              `}
            </style>

            <div
              className="compact-image-fields"
              style={{width: '100%', minWidth: 0}}
            >
              {renderDefault(props)}
            </div>
          </>
        )}
      </div>
    )
  }

  // No image uploaded — default Sanity upload UI
  return <>{renderDefault(props)}</>
}

/**
 * Wrapper for schemas that need custom image fields visible.
 */
export function CompactImageInputWithFields(props: ObjectInputProps) {
  return <CompactImageInput {...props} showCustomFields />
}
