'use client'

import { useRef, useState, useEffect } from 'react'
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteIcon from '@mui/icons-material/Delete'
import CameraAltIcon from '@mui/icons-material/CameraAlt'

interface Props {
  value: string  // current coverUrl
  onChange: (url: string) => void
}

export default function CoverUpload({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [hasCameraApi, setHasCameraApi] = useState(false)

  useEffect(() => {
    // Check if getUserMedia is available (desktop/mobile with modern browser)
    setHasCameraApi(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  }, [])

  async function handleFile(file: File) {
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Upload fehlgeschlagen')
      else onChange(data.url)
    } catch {
      setError('Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  async function openCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      setCameraOpen(true)
      // Attach stream after dialog renders
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 100)
    } catch {
      setError('Kamerazugriff verweigert oder nicht verfügbar')
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOpen(false)
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    closeCamera()

    canvas.toBlob(async (blob) => {
      if (!blob) { setError('Foto konnte nicht erstellt werden'); return }
      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
      await handleFile(file)
    }, 'image/jpeg', 0.92)
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Buchcover
      </Typography>

      {value ? (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Cover"
            style={{ width: 80, height: 110, objectFit: 'cover', borderRadius: 4, border: '1px solid #e0e0e0' }}
          />
          <Box>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onChange('')}
            >
              Entfernen
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={uploading ? <CircularProgress size={14} /> : <UploadFileIcon />}
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            Datei hochladen
          </Button>
          {hasCameraApi ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={uploading ? <CircularProgress size={14} /> : <PhotoCameraIcon />}
              disabled={uploading}
              onClick={openCamera}
            >
              Foto aufnehmen
            </Button>
          ) : (
            // Fallback for environments without getUserMedia (e.g. http, old browsers)
            <Button
              variant="outlined"
              size="small"
              startIcon={uploading ? <CircularProgress size={14} /> : <CameraAltIcon />}
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              Foto aufnehmen
            </Button>
          )}
        </Box>
      )}

      {/* Hidden file input for manual file picking */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {/* Off-screen canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onClose={closeCamera} maxWidth="sm" fullWidth>
        <DialogTitle>Foto aufnehmen</DialogTitle>
        <DialogContent sx={{ p: 1 }}>
          <Box sx={{ position: 'relative', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', display: 'block', maxHeight: 400 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCamera} color="inherit">Abbrechen</Button>
          <Button onClick={capturePhoto} variant="contained" startIcon={<PhotoCameraIcon />}>
            Aufnehmen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
