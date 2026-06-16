import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#003B27',
          borderRadius: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* sign board */}
        <div
          style={{
            background: '#00853F',
            width: '86%',
            height: '70%',
            borderRadius: '3px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '2px',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1,
              letterSpacing: '-0.5px',
            }}
          >
            GO
          </span>
          <span
            style={{
              fontSize: '4px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.8)',
              letterSpacing: '1.5px',
              marginTop: '1px',
            }}
          >
            STATUS
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
