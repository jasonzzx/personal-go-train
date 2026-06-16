import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#003B27',
          borderRadius: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* sign board */}
        <div
          style={{
            background: '#00853F',
            width: '148px',
            height: '108px',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* top darker stripe */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '18px',
              background: '#005C2B',
              borderRadius: '14px 14px 0 0',
              display: 'flex',
            }}
          />
          {/* GO text */}
          <span
            style={{
              fontSize: '58px',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1,
              letterSpacing: '-2px',
              marginTop: '8px',
            }}
          >
            GO
          </span>
          {/* STATUS text */}
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.82)',
              letterSpacing: '5px',
              marginTop: '2px',
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
