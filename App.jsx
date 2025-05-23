import React from 'react'
import Header from './components/Header'
import AboutMe from './components/AboutMe'
import Books from './components/Books'
import InstagramFeed from './components/InstagramFeed'
import YouTubeVideos from './components/YouTubeVideos'
import Footer from './components/Footer'
import './App.css'

function App() {
  const bio = `Hi there! I'm a **Test Automation Engineer** with over a decade of experience in IT, but my journey extends beyond technology into the realms of music, writing, and conscious living. 

Music has always been a vital part of my life. Through **DJing**, I've created [**17 mixes**](https://www.youtube.com/@juliamerkusheva), each one a unique expression of creativity and emotion. While currently on pause, this passion remains an essential part of who I am.

**Prague** is my home, where I live with my **wonderful husband and our son** who constantly inspires me. Together, we embrace a lifestyle centered on freedom, flexibility, and mindful choices.

Writing **children's books** brings me immense joy. Each story I write aims to spark curiosity and imagination in young minds. My books reflect my belief in the power of storytelling to shape young perspectives.

Living consciously guides my choices - from maintaining a **meat-free diet** to ensuring everything I use aligns with **cruelty-free** values. This commitment reflects my deep respect for all forms of life.

I also help others create meaningful digital experiences through AI-powered solutions. 
If you're interested in crafting something unique and beautiful, I'd love to collaborate.



P.S.

I'm Ukrainian, and I dream of a free, peaceful Ukraine — free from Russian aggression.

If you'd like to support our fight for freedom, please consider donating to our defenders here:

[Come Back Alive Foundation](https://savelife.in.ua/)

Many animals also suffer because of the war. Help protect them by donating to:

[UAnimals](https://uanimals.org/)

Thank you for standing with us. 💛💙`

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <AboutMe bio={bio} />
        <Books />
        <InstagramFeed />
        <YouTubeVideos />
      </main>
      <Footer />
    </div>
  )
}

export default App
