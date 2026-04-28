'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert, Box, Button, Card, CardActionArea, CardContent, CircularProgress,
  Container, Dialog, DialogContent, DialogTitle, Divider, IconButton,
  LinearProgress, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import PreviewIcon from '@mui/icons-material/Visibility'
import MailOutlineIcon from '@mui/icons-material/Mail'
import CloseIcon from '@mui/icons-material/Close'
import NewspaperIcon from '@mui/icons-material/Newspaper'
import BuildIcon from '@mui/icons-material/Build'
import CelebrationIcon from '@mui/icons-material/Celebration'
import AnnouncementIcon from '@mui/icons-material/Announcement'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'

type TemplateId = 'broadcast-news' | 'broadcast-maintenance' | 'broadcast-event' | 'broadcast-general' | 'broadcast-changelog' | 'broadcast-newbooks'

const BROADCAST_LOCALES = ['de', 'en', 'fr', 'es'] as const
type BroadcastLocale = typeof BROADCAST_LOCALES[number]

interface Template {
  id: TemplateId
  label: string
  description: string
  color: string
  bgColor: string
  icon: React.ReactNode
  eyebrow: string
  showTime: boolean
}

const TEMPLATES: Template[] = [
  {
    id: 'broadcast-news',
    label: 'Neuigkeiten',
    description: 'Allgemeine Neuigkeiten und Ankündigungen',
    color: '#1565c0',
    bgColor: '#e3f2fd',
    icon: <NewspaperIcon />,
    eyebrow: '📰 Neuigkeiten',
    showTime: true,
  },
  {
    id: 'broadcast-maintenance',
    label: 'Wartung',
    description: 'Hinweise auf geplante Wartungsarbeiten oder Ausfälle',
    color: '#e65100',
    bgColor: '#fff3e0',
    icon: <BuildIcon />,
    eyebrow: '🔧 Wartungshinweis',
    showTime: true,
  },
  {
    id: 'broadcast-event',
    label: 'Veranstaltung',
    description: 'Einladung zu einem Event oder einer Veranstaltung',
    color: '#2e7d32',
    bgColor: '#e8f5e9',
    icon: <CelebrationIcon />,
    eyebrow: '🎉 Veranstaltung',
    showTime: true,
  },
  {
    id: 'broadcast-general',
    label: 'Mitteilung',
    description: 'Allgemeine Mitteilung ohne spezifische Kategorie',
    color: '#4a148c',
    bgColor: '#f3e5f5',
    icon: <AnnouncementIcon />,
    eyebrow: '📢 Mitteilung',
    showTime: true,
  },
  {
    id: 'broadcast-changelog',
    label: 'Software-Update',
    description: 'Neue Funktionen und Änderungen in der App',
    color: '#00695c',
    bgColor: '#e0f2f1',
    icon: <RocketLaunchIcon />,
    eyebrow: '🚀 Software-Update',
    showTime: false,
  },
  {
    id: 'broadcast-newbooks',
    label: 'Neue Bücher',
    description: 'Neue Bücher im Bestand bewerben',
    color: '#6a1b9a',
    bgColor: '#f3e5f5',
    icon: <AutoStoriesIcon />,
    eyebrow: '📖 Neue Bücher',
    showTime: true,
  },
]

export default function BroadcastPage() {
  const { t } = useTranslation()
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('broadcast-news')
  const [subjects, setSubjects] = useState<Record<BroadcastLocale, string>>({ de: '', en: '', fr: '', es: '' })
  const [messages, setMessages] = useState<Record<BroadcastLocale, string>>({ de: '', en: '', fr: '', es: '' })
  const [activeTab, setActiveTab] = useState<BroadcastLocale>('de')
  const [timeFrom, setTimeFrom] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null)
  const [error, setError] = useState('')

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [testMailLoading, setTestMailLoading] = useState(false)
  const [testMailResult, setTestMailResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null)
  const [testMailError, setTestMailError] = useState('')

  const tpl = TEMPLATES.find((tpl) => tpl.id === selectedTemplate)!

  const LANG_TAB_LABELS: Record<BroadcastLocale, string> = {
    de: t('admin.broadcast.langTabDe'),
    en: t('admin.broadcast.langTabEn'),
    fr: t('admin.broadcast.langTabFr'),
    es: t('admin.broadcast.langTabEs'),
  }

  function buildPayload() {
    return {
      subjects,
      messages,
      template: selectedTemplate,
      timeFrom: timeFrom.trim() || undefined,
      timeTo: timeTo.trim() || undefined,
    }
  }

  async function handlePreview() {
    if (!subjects.de.trim() || !messages.de.trim()) { setError(t('admin.broadcast.subjectRequired') + ' ' + t('admin.broadcast.messageRequired')); return }
    setError('')
    setPreviewLoading(true)
    try {
      const res = await fetch('/api/admin/broadcast/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), sendTest: false }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? t('common.error')); return }
      setPreviewHtml(data.html)
      setPreviewOpen(true)
      setTestMailResult(null)
      setTestMailError('')
    } catch {
      setError(t('common.networkError'))
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleSendTest() {
    setTestMailLoading(true)
    setTestMailResult(null)
    setTestMailError('')
    try {
      const res = await fetch('/api/admin/broadcast/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), sendTest: true }),
      })
      const data = await res.json()
      if (!res.ok) { setTestMailError(data.error ?? t('common.error')); return }
      setTestMailResult(data)
    } catch {
      setTestMailError(t('common.networkError'))
    } finally {
      setTestMailLoading(false)
    }
  }

  async function handleSend() {
    if (!subjects.de.trim()) { setError(t('admin.broadcast.subjectRequired')); return }
    if (!messages.de.trim()) { setError(t('admin.broadcast.messageRequired')); return }
    setError('')
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? t('common.error')); return }
      setResult(data)
    } catch {
      setError(t('common.networkError'))
    } finally {
      setSending(false)
    }
  }

  const previewSubject = subjects[activeTab] || subjects.de
  const previewMessage = messages[activeTab] || messages.de

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SendIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5">{t('admin.broadcast.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.broadcast.subtitle')}
          </Typography>
        </Box>
      </Box>

      {/* Template picker */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {t('admin.broadcast.chooseTemplate')}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1.5, mb: 3 }}>
        {TEMPLATES.map((tmpl) => (
          <Card
            key={tmpl.id}
            variant={selectedTemplate === tmpl.id ? 'elevation' : 'outlined'}
            sx={{
              border: selectedTemplate === tmpl.id ? `2px solid ${tmpl.color}` : '1px solid',
              borderColor: selectedTemplate === tmpl.id ? tmpl.color : 'divider',
              transition: 'border-color 0.15s',
            }}
          >
            <CardActionArea onClick={() => setSelectedTemplate(tmpl.id)} sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: 1.5, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', bgcolor: tmpl.bgColor, color: tmpl.color, flexShrink: 0,
                  }}
                >
                  {tmpl.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {tmpl.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                    {tmpl.description}
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      {/* Email preview header */}
      <Box sx={{ borderRadius: 1.5, overflow: 'hidden', mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ bgcolor: tpl.color, color: '#fff', px: 3, py: 2 }}>
          <Typography variant="caption" sx={{ opacity: 0.85, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
            {tpl.eyebrow}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
            {previewSubject || t('admin.broadcast.subjectLabel')}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>📚 Bibliothek</Typography>
        </Box>
        <Box sx={{ bgcolor: 'background.paper', px: 3, py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {previewMessage ? (previewMessage.length > 140 ? previewMessage.slice(0, 140) + '…' : previewMessage) : t('admin.broadcast.messagePlaceholder')}
          </Typography>
          {(timeFrom || timeTo) && (
            <Box sx={{ mt: 1, display: 'inline-block', bgcolor: tpl.bgColor, borderRadius: 1, px: 1.5, py: 0.5 }}>
              <Typography variant="caption" sx={{ color: tpl.color, fontWeight: 600 }}>
                🕐 {timeFrom}{timeFrom && timeTo ? ' – ' : ''}{timeTo}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Form */}
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('admin.broadcast.compose')}</Typography>
          <Divider />

          {/* Language tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v as BroadcastLocale)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {BROADCAST_LOCALES.map((locale) => (
              <Tab key={locale} value={locale} label={LANG_TAB_LABELS[locale]} />
            ))}
          </Tabs>

          {BROADCAST_LOCALES.map((locale) => (
            <Box key={locale} sx={{ display: activeTab === locale ? 'flex' : 'none', flexDirection: 'column', gap: 2 }}>
              <TextField
                label={t('admin.broadcast.subjectLabel')}
                value={subjects[locale]}
                onChange={(e) => setSubjects((prev) => ({ ...prev, [locale]: e.target.value }))}
                required={locale === 'de'}
                fullWidth
                size="small"
                placeholder={t('admin.broadcast.subjectPlaceholder')}
              />
              <TextField
                label={t('admin.broadcast.messageLabel')}
                value={messages[locale]}
                onChange={(e) => setMessages((prev) => ({ ...prev, [locale]: e.target.value }))}
                required={locale === 'de'}
                fullWidth
                multiline
                rows={5}
                size="small"
                placeholder={t('admin.broadcast.messagePlaceholder')}
              />
            </Box>
          ))}

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {t('admin.broadcast.timeSection')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Tooltip title={t('admin.broadcast.tooltipTimeFrom')}>
                <TextField
                  label={t('admin.broadcast.timeFrom')}
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  size="small"
                  placeholder={t('admin.broadcast.timeFromPlaceholder')}
                  sx={{ flex: 1, minWidth: 200 }}
                />
              </Tooltip>
              <Tooltip title={t('admin.broadcast.tooltipTimeTo')}>
                <TextField
                  label={t('admin.broadcast.timeTo')}
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  size="small"
                  placeholder={t('admin.broadcast.timeToPlaceholder')}
                  sx={{ flex: 1, minWidth: 200 }}
                />
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {t('admin.broadcast.timeHelper')}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {result && (
        <Alert
          severity={result.failed === 0 ? 'success' : result.sent === 0 ? 'error' : 'warning'}
          icon={result.failed === 0 ? <CheckCircleIcon /> : <ErrorIcon />}
          sx={{ mt: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {result.sent === 1
              ? t('admin.broadcast.sentSuccess', { count: result.sent })
              : t('admin.broadcast.sentSuccessPlural', { count: result.sent })}
            {result.failed > 0 && t('admin.broadcast.failedCount', { count: result.failed })}
          </Typography>
          {result.errors.length > 0 && (
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
              {result.errors.map((e, i) => (
                <li key={i}><Typography variant="caption">{e}</Typography></li>
              ))}
            </Box>
          )}
        </Alert>
      )}

      {sending && <LinearProgress sx={{ mt: 2 }} />}

      <Box sx={{ mt: 2, display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={previewLoading ? <CircularProgress size={16} /> : <PreviewIcon />}
          onClick={handlePreview}
          disabled={previewLoading || sending || !subjects.de.trim() || !messages.de.trim()}
        >
          {t('admin.broadcast.previewButton')}
        </Button>
        <Button
          variant="contained"
          size="large"
          startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
          onClick={handleSend}
          disabled={sending || !subjects.de.trim() || !messages.de.trim()}
        >
          {sending ? t('admin.broadcast.sending') : t('admin.broadcast.sendButton')}
        </Button>
      </Box>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PreviewIcon />
            <Typography variant="h6">{t('admin.broadcast.previewTitle')}</Typography>
          </Box>
          <IconButton onClick={() => setPreviewOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {/* Test send area */}
          <Box sx={{ px: 3, py: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {t('admin.broadcast.testMailNote')}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={testMailLoading ? <CircularProgress size={14} /> : <MailOutlineIcon />}
                onClick={handleSendTest}
                disabled={testMailLoading}
              >
                {t('admin.broadcast.testMailButton')}
              </Button>
            </Box>
            {testMailError && (
              <Alert severity="error" sx={{ mt: 1 }} onClose={() => setTestMailError('')}>{testMailError}</Alert>
            )}
            {testMailResult && (
              <Alert
                severity={testMailResult.failed === 0 ? 'success' : 'warning'}
                sx={{ mt: 1 }}
                onClose={() => setTestMailResult(null)}
              >
                {testMailResult.sent === 1 ? t('admin.broadcast.sentSuccess', { count: testMailResult.sent }) : t('admin.broadcast.sentSuccessPlural', { count: testMailResult.sent })}
                {testMailResult.failed > 0 && t('admin.broadcast.failedCount', { count: testMailResult.failed })}
              </Alert>
            )}
          </Box>
          {/* HTML preview */}
          <Box
            component="iframe"
            srcDoc={previewHtml}
            sx={{ width: '100%', height: 600, border: 'none', display: 'block' }}
            title={t('admin.broadcast.previewTitle')}
          />
        </DialogContent>
      </Dialog>
    </Container>
  )
}
