<template>
  <section class="page">
    <header class="page-header">
      <div>
        <h1>Bienvenue sur Amazing Calendar</h1>
        <p v-if="user">Connecté en tant que {{ user.name }} ({{ user.email }})</p>
        <p v-else>Connecte-toi pour voir tes événements.</p>
      </div>
      <button class="primary" @click="openCreateForm" :disabled="!user">
        + Nouvel évènement
      </button>
    </header>

    <div v-if="!user" class="card info">
      <p>Tu dois être connecté pour consulter ou créer des événements.</p>
      <router-link to="/login" class="primary-link">Aller à la connexion</router-link>
    </div>

    <div v-else class="sections">
      <article class="card collapsible">
        <header @click="toggle('upcoming')">
          <h2>Évènements à venir</h2>
          <span>{{ showUpcoming ? '–' : '+' }}</span>
        </header>
        <transition name="fade">
          <div v-show="showUpcoming">
            <p v-if="loadingUpcoming">Chargement...</p>
            <p v-else-if="upcomingEvents.length === 0" class="muted">Aucun évènement à venir.</p>
            <ul v-else>
              <li
                v-for="event in upcomingEvents"
                :key="event.id"
                class="event-item"
              >
                <div class="event-header">
                  <div>
                    <div class="event-title">{{ event.title }}</div>
                    <small>{{ formatDate(event.startTime) }} → {{ formatDate(event.endTime) }}</small>
                    <div v-if="getCurrentStatus(event)" class="status-pill" :class="getCurrentStatus(event)">
                      Statut: {{ getCurrentStatus(event) }}
                    </div>
                    <div v-if="showResponseButtons(event)" class="respond-row">
                      <button class="primary sm" @click="respond(event.id, 'ACCEPTED')">Accepter</button>
                      <button class="ghost sm" @click="respond(event.id, 'DECLINED')">Refuser</button>
                    </div>
                  </div>
                  <div class="event-actions">
                    <button class="ghost sm pointer" @click.stop="openEditForm(event)" :disabled="!canEdit(event)">Modifier</button>
                    <button class="ghost sm pointer" @click.stop="toggleInvitePanel(event.id)">Invités</button>
                    <button class="ghost sm danger pointer" @click.stop="confirmDelete(event)" :disabled="!canEdit(event)">Supprimer</button>
                  </div>
                </div>
                <p class="event-description">{{ event.description || 'Pas de description' }}</p>
                <div v-if="inviteState[event.id]?.open" class="invite-panel">
                  <form v-if="canInvite(event)" @submit.prevent="submitInvite(event.id)">
                    <input
                      v-model="inviteState[event.id].email"
                      type="email"
                      placeholder="Email de l'invité"
                      required
                    />
                    <button type="submit" class="primary sm" :disabled="inviteState[event.id].loading">
                      {{ inviteState[event.id].loading ? 'Invitation...' : 'Inviter' }}
                    </button>
                  </form>
                  <p v-if="inviteState[event.id].message" :class="['form-message', { error: inviteState[event.id].error }]">
                    {{ inviteState[event.id].message }}
                  </p>
                  <div v-if="event.participants?.length" class="invited-list">
                    <p>Invités :</p>
                    <ul>
                      <li v-for="participant in event.participants" :key="participant.id" class="participant-row">
                        <span>{{ participant.user.email }} — {{ participant.status }}</span>
                        <div class="participant-actions">
                          <button
                            v-if="canEdit(event) && participant.user.id !== user?.id"
                            class="ghost sm pointer"
                            @click.prevent="handleParticipantRemoval(event.id, participant)">
                            Retirer
                          </button>
                          <button
                            v-else-if="participant.user.id === user?.id"
                            class="ghost sm"
                            @click.prevent="handleParticipantRemoval(event.id, participant)">
                            Quitter
                          </button>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </transition>
      </article>

      <article class="card collapsible">
        <header @click="toggle('past')">
          <h2>Évènements passés</h2>
          <span>{{ showPast ? '–' : '+' }}</span>
        </header>
        <transition name="fade">
          <div v-show="showPast">
            <p v-if="loadingPast">Chargement...</p>
            <p v-else-if="pastEvents.length === 0" class="muted">Aucun évènement passé.</p>
            <ul v-else>
              <li
                v-for="event in pastEvents"
                :key="event.id"
                class="event-item"
              >
                <div class="event-header">
                  <div>
                    <div class="event-title">{{ event.title }}</div>
                    <small>{{ formatDate(event.startTime) }} → {{ formatDate(event.endTime) }}</small>
                    <div v-if="getCurrentStatus(event)" class="status-pill" :class="getCurrentStatus(event)">
                      Statut: {{ getCurrentStatus(event) }}
                    </div>
                    <div v-if="showResponseButtons(event)" class="respond-row">
                      <button class="primary sm" @click="respond(event.id, 'ACCEPTED')">Accepter</button>
                      <button class="ghost sm" @click="respond(event.id, 'DECLINED')">Refuser</button>
                    </div>
                  </div>
                  <div class="event-actions">
                    <button class="ghost sm" @click.stop="openEditForm(event)" :disabled="!canEdit(event)">Modifier</button>
                    <button class="ghost sm" @click.stop="toggleInvitePanel(event.id)">Invités</button>
                    <button class="ghost sm danger" @click.stop="confirmDelete(event)" :disabled="!canEdit(event)">Supprimer</button>
                  </div>
                </div>
               <p class="event-description">{{ event.description || 'Pas de description' }}</p>
                <div v-if="inviteState[event.id]?.open" class="invite-panel">
                  <form v-if="canInvite(event)" @submit.prevent="submitInvite(event.id)">
                    <input
                      v-model="inviteState[event.id].email"
                      type="email"
                      placeholder="Email de l'invité"
                      required
                    />
                    <button type="submit" class="primary sm" :disabled="inviteState[event.id].loading">
                      {{ inviteState[event.id].loading ? 'Invitation...' : 'Inviter' }}
                    </button>
                  </form>
                  <p v-if="inviteState[event.id].message" :class="['form-message', { error: inviteState[event.id].error }]">
                    {{ inviteState[event.id].message }}
                  </p>
                  <div v-if="event.participants?.length" class="invited-list">
                    <p>Invités :</p>
                    <ul>
                      <li v-for="participant in event.participants" :key="participant.id" class="participant-row">
                        <span>{{ participant.user.email }} — {{ participant.status }}</span>
                        <div class="participant-actions">
                          <button
                            v-if="canEdit(event) && participant.user.id !== user?.id"
                            class="ghost sm"
                            @click.prevent="handleParticipantRemoval(event.id, participant)">
                            Retirer
                          </button>
                          <button
                            v-else-if="participant.user.id === user?.id"
                            class="ghost sm"
                            @click.prevent="handleParticipantRemoval(event.id, participant)">
                            Quitter
                          </button>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </transition>
      </article>
    </div>

    <div v-if="showCreateModal" class="modal-backdrop">
      <div class="modal card">
        <header>
          <h2>{{ isEditing ? 'Modifier l’évènement' : 'Créer un évènement' }}</h2>
          <button class="icon" @click="closeCreateForm">×</button>
        </header>
        <form @submit.prevent="submitEvent">
          <label>Titre
            <input v-model="eventForm.title" required />
          </label>
          <label>Description
            <textarea v-model="eventForm.description" rows="2"></textarea>
          </label>
          <label>Début
            <input v-model="eventForm.startTime" type="datetime-local" required />
          </label>
          <label>Fin
            <input v-model="eventForm.endTime" type="datetime-local" required />
          </label>
          <label>Lieu
            <input v-model="eventForm.location" />
          </label>
          <div class="modal-actions">
            <button type="button" class="ghost" @click="closeCreateForm">Annuler</button>
            <button type="submit" class="primary" :disabled="creating">
              {{ creating ? (isEditing ? 'Modification...' : 'Création...') : (isEditing ? 'Mettre à jour' : 'Créer') }}
            </button>
          </div>
          <p v-if="formMessage" :class="['form-message', { error: formError }]">
            {{ formMessage }}
          </p>
        </form>
      </div>
    </div>
  </section>
</template>

<script>
const API_BASE_URL = (process.env.VUE_APP_BACKEND_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'ac_token'
const USER_KEY = 'ac_user'

export default {
  name: 'HomeView',
  data() {
    return {
      user: null,
      token: null,
      upcomingEvents: [],
      pastEvents: [],
      loadingUpcoming: false,
      loadingPast: false,
      showUpcoming: true,
      showPast: false,
      showCreateModal: false,
      creating: false,
      formMessage: '',
      formError: false,
      eventForm: {
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: ''
      },
      isEditing: false,
      editingEventId: null,
      inviteState: {},
      responding: false
    }
  },
  created() {
    this.restoreSession()
    if (this.user && this.token) {
      this.loadEvents()
    }
  },
  methods: {
    restoreSession() {
      const storedUser = localStorage.getItem(USER_KEY)
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (storedUser && storedToken) {
        this.user = JSON.parse(storedUser)
        this.token = storedToken
      }
    },
    async loadEvents() {
      await Promise.all([this.fetchUpcoming(), this.fetchPast()])
    },
    async fetchUpcoming() {
      this.loadingUpcoming = true
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/upcoming`, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
        if (!res.ok) throw new Error('Impossible de charger les événements à venir')
        const data = await res.json()
        this.upcomingEvents = data
        this.populateParticipants(data)
      } catch (error) {
        console.error(error)
      } finally {
        this.loadingUpcoming = false
      }
    },
    async fetchPast() {
      this.loadingPast = true
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/past`, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
        if (!res.ok) throw new Error('Impossible de charger les événements passés')
        const data = await res.json()
        this.pastEvents = data
        this.populateParticipants(data)
      } catch (error) {
        console.error(error)
      } finally {
        this.loadingPast = false
      }
    },
    toggle(section) {
      if (section === 'upcoming') {
        this.showUpcoming = !this.showUpcoming
      } else if (section === 'past') {
        this.showPast = !this.showPast
      }
    },
    formatDate(value) {
      return new Date(value).toLocaleString()
    },
    openCreateForm() {
      if (!this.user) return
      this.showCreateModal = true
      this.formMessage = ''
      this.formError = false
      this.isEditing = false
      this.editingEventId = null
      this.resetForm()
    },
    closeCreateForm() {
      this.showCreateModal = false
      this.formMessage = ''
      this.formError = false
      this.resetForm()
    },
    resetForm() {
      this.eventForm = {
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: ''
      }
    },
    populateParticipants(events) {
      events.forEach((event) => {
        const existing = this.inviteState[event.id] || {}
        this.inviteState = {
          ...this.inviteState,
          [event.id]: {
            email: existing.email || '',
            loading: false,
            message: existing.message || '',
            error: existing.error || false,
            open: existing.open ?? false
          }
        }
      })
    },
    openEditForm(event) {
      if (!this.user) return
      this.isEditing = true
      this.editingEventId = event.id
      this.showCreateModal = true
      this.formMessage = ''
      this.formError = false
      this.eventForm = {
        title: event.title || '',
        description: event.description || '',
        startTime: this.toLocalInput(event.startTime),
        endTime: this.toLocalInput(event.endTime),
        location: event.location || ''
      }
    },
    toLocalInput(value) {
      if (!value) return ''
      const date = new Date(value)
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    },
    async submitEvent() {
      this.creating = true
      this.formMessage = ''
      this.formError = false
      try {
        const endpoint = this.isEditing
          ? `${API_BASE_URL}/api/events/${this.editingEventId}`
          : `${API_BASE_URL}/api/events`
        const method = this.isEditing ? 'PUT' : 'POST'
        const res = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify(this.eventForm)
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.message || 'Impossible de créer l’évènement')
        }
        this.formMessage = this.isEditing ? 'Évènement mis à jour !' : 'Évènement créé !'
        this.resetForm()
        this.loadEvents()
        setTimeout(() => {
          this.showCreateModal = false
          this.formMessage = ''
        }, 800)
      } catch (error) {
        this.formError = true
        this.formMessage = error.message
      } finally {
        this.creating = false
      }
    },
    toggleInvitePanel(eventId) {
      const state = this.inviteState[eventId]
      if (!state) {
        this.inviteState = {
          ...this.inviteState,
          [eventId]: {
            email: '',
            loading: false,
            message: '',
            error: false,
            open: true
          }
        }
      } else {
        state.open = !state.open
      }
    },
    async submitInvite(eventId) {
      const state = this.inviteState[eventId]
      if (!state || !state.email) return
      state.loading = true
      state.message = ''
      state.error = false
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify({ email: state.email })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.message || 'Impossible d’inviter cet utilisateur')
        }
        state.message = 'Invitation envoyée !'
        state.email = ''
        await this.loadEvents()
      } catch (error) {
        state.error = true
        state.message = error.message
      } finally {
        state.loading = false
    }
    },
    findParticipant(event) {
      if (!this.user) return null
      return (event.participants || []).find((p) => p.user.id === this.user.id)
    },
    canEdit(event) {
      if (!this.user) return false
      return event.createdBy && event.createdBy.id === this.user.id
    },
    canInvite(event) {
      return this.canEdit(event)
    },
    getCurrentStatus(event) {
      const participant = this.findParticipant(event)
      return participant ? participant.status : null
    },
    showResponseButtons(event) {
      const participant = this.findParticipant(event)
      return participant && participant.status === 'INVITED'
    },
    async respond(eventId, status) {
      if (this.responding) return
      this.responding = true
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify({ status })
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Impossible de mettre à jour la participation')
        }
        await this.loadEvents()
      } catch (error) {
        alert(error.message)
      } finally {
        this.responding = false
      }
    },
    async handleParticipantRemoval(eventId, participant) {
      if (!this.user) return
      const isSelf = participant.user.id === this.user.id
      const message = isSelf
        ? 'Souhaites-tu quitter cet évènement ?'
        : `Supprimer ${participant.user.email} de l'évènement ?`
      if (!window.confirm(message)) return
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/participants/${participant.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Action impossible')
        }
        await this.loadEvents()
      } catch (error) {
        alert(error.message)
      }
    },
    async confirmDelete(event) {
      if (!this.canEdit(event)) {
        return
      }
      const confirmed = window.confirm(`Supprimer l'évènement "${event.title}" ?`)
      if (!confirmed) return
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/${event.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Impossible de supprimer cet évènement')
        }
        await this.loadEvents()
      } catch (error) {
        alert(error.message)
      }
    }
  }
}
</script>

<style scoped>
.page {
  padding: 2.5rem 1rem 4rem;
  max-width: 960px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card {
  background: #fff;
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.card.info {
  text-align: center;
}

.primary-link {
  display: inline-block;
  margin-top: 0.5rem;
  color: #2563eb;
  font-weight: 600;
}

.collapsible header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.collapsible ul {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.collapsible li {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.event-item {
  cursor: pointer;
  position: relative;
  padding-bottom: 1.5rem;
}

.event-title {
  font-weight: 600;
}

.event-description {
  color: #475569;
  margin: 0.4rem 0 0;
}

.status-pill {
  margin-top: 0.3rem;
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  background: #e2e8f0;
  color: #1f2933;
}

.status-pill.ACCEPTED {
  background: #d1fae5;
  color: #065f46;
}

.status-pill.DECLINED {
  background: #fee2e2;
  color: #991b1b;
}

.status-pill.INVITED {
  background: #fef3c7;
  color: #92400e;
}

.respond-row {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

.muted {
  color: #94a3b8;
}

.primary {
  border: none;
  border-radius: 8px;
  background: #42b983;
  color: #fff;
  padding: 0.65rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ghost {
  border: 1px solid #cbd5f5;
  background: transparent;
  color: #1f2933;
  border-radius: 8px;
  padding: 0.5rem 1rem;
}

.ghost.sm {
  padding: 0.3rem 0.8rem;
  font-size: 0.85rem;
}

.ghost.sm.danger {
  color: #b91c1c;
  border-color: #fecaca;
}

.event-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.event-actions {
  display: flex;
  gap: 0.5rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  width: min(480px, 100%);
  max-height: 90vh;
  overflow-y: auto;
}

.modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.modal input,
.modal textarea {
  width: 100%;
  border: 1px solid #d7dfe9;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.icon {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
}

.form-message {
  margin-top: 0.5rem;
  font-weight: 600;
  color: #1f8c4d;
}

.form-message.error {
  color: #d93025;
}

.invite-panel {
  margin-top: 1rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.invite-panel form {
  display: flex;
  gap: 0.5rem;
}

.invite-panel input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #cbd5f5;
}

.invited-list {
  margin-top: 0.75rem;
}

.invited-list ul {
  list-style: disc;
  padding-left: 1.2rem;
  margin: 0.25rem 0 0;
}

.participant-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.participant-actions {
  display: flex;
  gap: 0.3rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pointer:hover {
  cursor: pointer;
}
</style>
