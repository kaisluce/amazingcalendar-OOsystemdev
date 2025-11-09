<template>
  <div id="app">
    <nav>
      <router-link to="/">Accueil</router-link>
      <router-link to="/about">À propos</router-link>
      <router-link to="/login">Connexion</router-link>
    </nav>

    <router-view />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #f5f7fb;
  color: #1f2933;
}

#app {
  text-align: center;
}

nav {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #fff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

nav a {
  text-decoration: none;
  font-weight: 600;
  color: #1f2933;
}

nav a.router-link-active {
  color: #42b983;
}
</style>
