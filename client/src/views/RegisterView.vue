<template>
  <div class="register-page">
    <div class="card">
      <h2>Inscription</h2>
      <p class="subtitle">Crée un compte pour commencer à utiliser Amazing Calendar.</p>
      <form @submit.prevent="submitRegister">
        <label for="name">Nom</label>
        <input
          id="name"
          type="text"
          v-model.trim="name"
          required
          :disabled="loading"
        />

        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          v-model.trim="email"
          required
          :disabled="loading"
        />

        <label for="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          v-model="password"
          required
          :disabled="loading"
        />

        <button type="submit" :disabled="loading">
          {{ loading ? 'Création...' : 'Créer un compte' }}
        </button>
      </form>

      <p
        v-if="message"
        class="message"
        :class="{ success: !hasError, error: hasError }"
      >
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script>
const API_BASE_URL = (process.env.VUE_APP_BACKEND_URL || '').replace(/\/$/, '')

export default {
  name: 'RegisterView',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      loading: false,
      message: '',
      hasError: false
    }
  },
  methods: {
    async submitRegister() {
      this.loading = true
      this.message = ''
      this.hasError = false

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: this.name,
            email: this.email,
            password: this.password
          })
        })

        const text = await response.text()
        this.hasError = !response.ok
        this.message = text

        if (response.ok) {
          this.name = ''
          this.email = ''
          this.password = ''
        }
      } catch (error) {
        console.error('Register error', error)
        this.hasError = true
        this.message = 'Une erreur est survenue.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: #f5f7fb;
}

.card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  padding: 2.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 15px 45px rgba(15, 23, 42, 0.15);
}

.subtitle {
  color: #5f6b7c;
  margin-bottom: 1.5rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

label {
  font-weight: 600;
  text-align: left;
  color: #1f2933;
}

input {
  padding: 0.75rem 0.9rem;
  border: 1px solid #d7dfe9;
  border-radius: 10px;
  font-size: 1rem;
}

button {
  margin-top: 0.5rem;
  padding: 0.85rem;
  border-radius: 10px;
  border: none;
  background-color: #2563eb;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.message {
  margin-top: 1rem;
  font-weight: 600;
}

.message.success {
  color: #1f8c4d;
}

.message.error {
  color: #d93025;
}
</style>
