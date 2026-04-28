'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Container, Divider, Grid, TextField, Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import EditIcon from '@mui/icons-material/Edit'
import Link from 'next/link'
import ThemengebietPicker from '@/app/components/TopicPicker'
import ProgrammiersprachePicker from '@/app/components/LanguagePicker'
import HauptkategoriePicker from '@/app/components/CategoryPicker'
import CoverUpload from '@/app/components/CoverUpload'
import PrintLabelButtons from '@/app/components/PrintLabelButtons'

export default function EditBookPage({ params }: { params: Promise<{ barcode: string }> }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [barcode, setBarcode] = useState('')
  const [form, setForm] = useState({
    title: '', author: '', publisher: '', year: '',
    language: '', description: '', coverUrl: '',
    totalCopies: '1', loanDurationWeeks: '13',
    hauptkategorie: '', regalnummer: '',
  })
  const [tags, setTags] = useState<string[]>([])
  const [programmiersprachen, setProgrammiersprachen] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    params.then(({ barcode: bc }) => {
      setBarcode(bc)
      fetch(`/api/books/${bc}`)
        .then((r) => r.json())
        .then((book) => {
          setForm({
            title: book.title ?? '',
            author: book.author ?? '',
            publisher: book.publisher ?? '',
            year: book.year ? String(book.year) : '',
            language: book.language ?? 'de',
            description: book.description ?? '',
            coverUrl: book.coverUrl ?? '',
            totalCopies: String(book.totalCopies ?? 1),
            loanDurationWeeks: String(book.loanDurationWeeks ?? 13),
            hauptkategorie: book.hauptkategorie ?? '',
            regalnummer: book.regalnummer ?? '',
          })
          if (book.tags) {
            setTags(book.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean))
          }
          if (book.programmiersprachen) {
            setProgrammiersprachen(book.programmiersprachen.split(',').map((l: string) => l.trim()).filter(Boolean))
          }
        })
        .finally(() => setFetching(false))
    })
  }, [params])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleHauptkategorieChange(code: string) {
    set('hauptkategorie', code)
    // Only auto-suggest if regalnummer is currently empty
    if (!code || form.regalnummer) return
    try {
      const res = await fetch(`/api/books/regalnummer/suggest/${code}`)
      if (res.ok) {
        const data = await res.json()
        set('regalnummer', data.regalnummer)
      }
    } catch { /* ignore */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/books/${barcode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          author: form.author,
          publisher: form.publisher || undefined,
          year: form.year ? parseInt(form.year, 10) : undefined,
          tags: tags.length > 0 ? tags.join(',') : undefined,
          programmiersprachen: programmiersprachen.length > 0 ? programmiersprachen.join(',') : undefined,
          hauptkategorie: form.hauptkategorie || undefined,
          regalnummer: form.regalnummer || undefined,
          language: form.language || 'de',
          description: form.description || undefined,
          coverUrl: form.coverUrl || undefined,
          totalCopies: parseInt(form.totalCopies, 10),
          loanDurationWeeks: parseInt(form.loanDurationWeeks, 10),
        }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? t('admin.books.updateFailed'))
      else router.push('/admin/books')
    } finally {
      setLoading(false)
    }
  }

  const tf = (label: string, field: keyof typeof form, required = false, type = 'text') => (
    <TextField
      key={field}
      label={label}
      value={form[field]}
      onChange={(e) => set(field, e.target.value)}
      required={required}
      type={type}
      fullWidth
      size="small"
    />
  )

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EditIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5">{t('admin.books.editTitle')}</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }} color="text.secondary">{barcode}</Typography>
            <br />
            <Typography variant="body2" color="text.secondary">
              <Link href="/admin/books" style={{ color: 'inherit' }}>{t('admin.books.backToOverview')}</Link>
            </Typography>
          </Box>
        </Box>
        {barcode && <PrintLabelButtons barcode={barcode} title={form.title} hasRegalnummer={!!form.regalnummer} />}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>{t('admin.books.bookDetails')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>{tf(t('admin.books.titleField'), 'title', true)}</Grid>
              <Grid size={{ xs: 12, sm: 4 }}>{tf(t('admin.books.yearField'), 'year', false, 'number')}</Grid>
              <Grid size={{ xs: 12, sm: 8 }}>{tf(t('admin.books.authorField'), 'author', true)}</Grid>
              <Grid size={{ xs: 12, sm: 4 }}>{tf(t('admin.books.languageField'), 'language')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf(t('admin.books.publisherField'), 'publisher')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf(t('admin.books.copiesField'), 'totalCopies', true, 'number')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <HauptkategoriePicker value={form.hauptkategorie} onChange={handleHauptkategorieChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{tf(t('admin.books.shelfField'), 'regalnummer')}</Grid>
              <Grid size={12}>
                <ThemengebietPicker selected={tags} onChange={setTags} />
              </Grid>
              <Grid size={12}>
                <ProgrammiersprachePicker selected={programmiersprachen} onChange={setProgrammiersprachen} />
              </Grid>
              <Grid size={12}>
                <TextField
                  label={t('admin.books.descriptionField')}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={12}>
                <CoverUpload value={form.coverUrl} onChange={(url) => set('coverUrl', url)} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>{t('admin.books.loanSection')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={6}>{tf(t('admin.books.maxDurationField'), 'loanDurationWeeks', true, 'number')}</Grid>
            </Grid>
          </CardContent>
        </Card>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          sx={{ alignSelf: 'flex-start', px: 4 }}
        >
          {loading ? t('admin.books.saving') : t('common.saveChanges')}
        </Button>
      </Box>
    </Container>
  )
}
