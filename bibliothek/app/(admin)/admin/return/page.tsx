'use client'

import { Suspense, useEffect, useState } from 'react'
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip,
  CircularProgress, Container, Divider, IconButton, Stack,
  TextField, Tooltip, Typography,
} from '@mui/material'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import PersonIcon from '@mui/icons-material/Person'

interface UserOption {
  id: string
  username: string
  email: string
  firstname?: string | null
  lastname?: string | null
}

interface BookEntry {
  input: string          // what the user typed
  barcode: string        // resolved EAN-13
  title: string
  regalnummer?: string | null
  resolving: boolean
  error: string
}

interface ReturnResult {
  bookId: string
  ok: boolean
  error?: string
}

function ReturnForm() {
  const [users, setUsers] = useState<UserOption[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)

  const [bookInput, setBookInput] = useState('')
  const [books, setBooks] = useState<BookEntry[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<ReturnResult[] | null>(null)
  const [submitError, setSubmitError] = useState('')

  // Load user list
  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setUsersLoading(false))
  }, [])

  async function resolveBook(input: string): Promise<{ barcode: string; title: string; regalnummer?: string | null } | null> {
    if (/^\d{13}$/.test(input)) {
      const res = await fetch(`/api/books/${input}`)
      if (res.ok) { const b = await res.json(); return { barcode: b.id, title: b.title, regalnummer: b.regalnummer } }
    }
    const res = await fetch(`/api/books/by-regalnummer/${encodeURIComponent(input)}`)
    if (res.ok) { const b = await res.json(); return { barcode: b.id, title: b.title, regalnummer: b.regalnummer } }
    return null
  }

  async function addBook() {
    const input = bookInput.trim()
    if (!input || books.some((b) => b.input === input)) { setBookInput(''); return }

    const entry: BookEntry = { input, barcode: '', title: '', regalnummer: null, resolving: true, error: '' }
    setBooks((prev) => [...prev, entry])
    setBookInput('')

    const result = await resolveBook(input)
    setBooks((prev) =>
      prev.map((b) =>
        b.input === input
          ? result
            ? { ...b, ...result, resolving: false }
            : { ...b, resolving: false, error: 'Buch nicht gefunden' }
          : b
      )
    )
  }

  function removeBook(input: string) {
    setBooks((prev) => prev.filter((b) => b.input !== input))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) { setSubmitError('Bitte Nutzer auswählen'); return }
    const validBooks = books.filter((b) => b.barcode && !b.error)
    if (validBooks.length === 0) { setSubmitError('Keine gültigen Bücher eingetragen'); return }

    setSubmitError('')
    setSubmitting(true)
    setResults(null)

    const res = await fetch('/api/admin/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selectedUser.id,
        bookIds: validBooks.map((b) => b.barcode),
      }),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setSubmitError(data.error ?? 'Fehler bei der Rückgabe')
    } else {
      setResults(data.results)
      // Remove successfully returned books from the list
      const returnedIds = new Set(
        (data.results as ReturnResult[]).filter((r) => r.ok).map((r) => r.bookId)
      )
      setBooks((prev) => prev.filter((b) => !returnedIds.has(b.barcode)))
    }
  }

  const validBookCount = books.filter((b) => b.barcode && !b.error).length

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {submitError && <Alert severity="error">{submitError}</Alert>}

      {/* Results */}
      {results && (
        <Alert severity={results.every((r) => r.ok) ? 'success' : 'warning'} onClose={() => setResults(null)}>
          {results.filter((r) => r.ok).length} von {results.length} Bücher erfolgreich zurückgegeben.
          {results.filter((r) => !r.ok).map((r) => (
            <Box key={r.bookId} sx={{ mt: 0.5, fontSize: 13 }}>
              <strong>{r.bookId}</strong>: {r.error}
            </Box>
          ))}
        </Alert>
      )}

      {/* User selection */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <PersonIcon sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Nutzer auswählen</Typography>
          </Box>
          <Autocomplete
            options={users}
            loading={usersLoading}
            getOptionLabel={(u) =>
              `${u.firstname ?? ''} ${u.lastname ?? ''} (${u.username}) — ${u.email}`.trim()
            }
            value={selectedUser}
            onChange={(_, val) => setSelectedUser(val)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderOption={(props, u) => (
              <Box component="li" {...props} key={u.id}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {u.firstname} {u.lastname} · <span style={{ fontFamily: 'monospace' }}>{u.username}</span>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Nutzer"
                size="small"
                placeholder="Name oder E-Mail suchen…"
              />
            )}
          />
          {selectedUser && (
            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selectedUser.firstname} {selectedUser.lastname}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedUser.username} · {selectedUser.email}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Book scan / entry */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Bücher einscannen / eintragen
          </Typography>
          <Typography variant="caption" color="text.secondary">
            EAN-13 Barcode oder Regalnummer (z.B. SAP0001). Enter oder Button zum Hinzufügen.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <TextField
              value={bookInput}
              onChange={(e) => setBookInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBook() } }}
              placeholder="EAN-13 oder Regalnummer…"
              size="small"
              sx={{ flex: 1, '& input': { fontFamily: 'monospace' } }}
              autoFocus
            />
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addBook} disabled={!bookInput.trim()}>
              Hinzufügen
            </Button>
          </Box>

          {books.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                {books.map((book) => (
                  <Box
                    key={book.input}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 1,
                      bgcolor: book.error ? '#fff5f5' : book.resolving ? 'grey.50' : '#f0fdf4',
                      border: '1px solid',
                      borderColor: book.error ? 'error.200' : book.resolving ? 'divider' : 'success.200',
                    }}
                  >
                    {book.resolving ? (
                      <CircularProgress size={18} />
                    ) : book.error ? (
                      <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
                    ) : (
                      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                        {book.title || book.input}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 0.25 }}>
                        {book.barcode && (
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            {book.barcode}
                          </Typography>
                        )}
                        {book.regalnummer && (
                          <Chip label={book.regalnummer} size="small" sx={{ height: 16, fontSize: 10 }} />
                        )}
                        {book.error && (
                          <Typography variant="caption" color="error">{book.error}</Typography>
                        )}
                      </Stack>
                    </Box>

                    <Tooltip title="Entfernen">
                      <IconButton size="small" onClick={() => removeBook(book.input)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      <Button
        type="submit"
        variant="contained"
        size="large"
        color="success"
        disabled={submitting || !selectedUser || validBookCount === 0}
        startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AssignmentReturnIcon />}
        sx={{ alignSelf: 'flex-start', px: 4 }}
      >
        {submitting
          ? 'Verarbeite…'
          : `${validBookCount} Buch${validBookCount !== 1 ? 'er' : ''} zurückgeben`}
      </Button>
    </Box>
  )
}

export default function ReturnBooksPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AssignmentReturnIcon sx={{ fontSize: 36, color: 'success.main' }} />
        <Box>
          <Typography variant="h5">Bücher zurückgeben</Typography>
          <Typography variant="body2" color="text.secondary">
            Nutzer auswählen, Bücher scannen / eintragen, bestätigen.
          </Typography>
        </Box>
      </Box>

      <Suspense fallback={<CircularProgress />}>
        <ReturnForm />
      </Suspense>
    </Container>
  )
}
