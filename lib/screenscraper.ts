interface ScreenscraperConfig {
  devId: string
  devPassword: string
  userName?: string
  userPassword?: string
}

interface ScreenscraperSystem {
  id: string
  nom: string
  nomcourt?: string
  parentid?: string
  constructeur?: string
  couleur?: string
  nbmedia?: string
  nbjeu?: string
  text?: string
  medias?: Array<{
    type: string
    url: string
    format: string
  }>
}

interface ScreenscraperGame {
  id: string
  nom: string
  systemeid: string
  editeur?: string
  developpeur?: string
  joueurs?: string
  note?: string
  description?: string
  genres?: Array<{ nom: string }>
  medias?: Array<{
    type: string
    url: string
    format: string
  }>
  rom?: {
    id: string
    filename: string
    size: string
    crc: string
    md5: string
    sha1: string
  }
}

interface ScreenscraperGameListItem {
  id: string
  nom: string
  systemeid: string
  editeur?: string
  developpeur?: string
  genres?: string
  note?: string
}

interface ScreenscraperSystemListResponse {
  header: {
    APIversion: string
    dateTime: string
    commandRequested: string
  }
  response?: {
    systemes?: ScreenscraperSystem[]
  }
  error?: string
}

interface ScreenscraperGameListResponse {
  header: {
    APIversion: string
    dateTime: string
    commandRequested: string
  }
  response?: {
    jeux?: ScreenscraperGameListItem[]
  }
  error?: string
}

interface ScreenscraperResponse {
  header: {
    APIversion: string
    dateTime: string
    commandRequested: string
  }
  response?: {
    jeu?: ScreenscraperGame
  }
  error?: string
}

class ScreenscraperAPI {
  private config: ScreenscraperConfig
  private baseUrl = 'https://www.screenscraper.fr/api2'
  private lastRequestTime = 0
  private minInterval = 1200 // 1.2 seconds minimum between requests

  constructor(config: ScreenscraperConfig) {
    this.config = config
  }

  private async throttleRequest(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
  }

  private buildAuthParams(): URLSearchParams {
    const params = new URLSearchParams({
      devid: this.config.devId,
      devpassword: this.config.devPassword,
      output: 'json',
      softname: 'super-retrogamers'
    })

    if (this.config.userName && this.config.userPassword) {
      params.append('ssid', this.config.userName)
      params.append('sspassword', this.config.userPassword)
    }

    return params
  }

  async getSystemList(): Promise<ScreenscraperSystem[]> {
    await this.throttleRequest()

    const urlParams = this.buildAuthParams()

    try {
      const response = await fetch(`${this.baseUrl}/systemesListe.php?${urlParams}`)
      
      if (!response.ok) {
        throw new Error(`Screenscraper API error: ${response.status} ${response.statusText}`)
      }

      const data: ScreenscraperSystemListResponse = await response.json()
      
      if (data.error) {
        throw new Error(`Screenscraper API error: ${data.error}`)
      }

      return data.response?.systemes || []
    } catch (error) {
      console.error('Error fetching system list from Screenscraper:', error)
      return []
    }
  }

  async getGameList(params: {
    systemId: number
    offset?: number
    maxResults?: number
    alphabeticalOrder?: boolean
  }): Promise<ScreenscraperGameListItem[]> {
    await this.throttleRequest()

    const urlParams = this.buildAuthParams()
    urlParams.append('systemeid', params.systemId.toString())
    
    if (params.offset !== undefined) urlParams.append('alpha', params.offset.toString())
    if (params.maxResults !== undefined) urlParams.append('maxresultats', params.maxResults.toString())
    if (params.alphabeticalOrder) urlParams.append('ordre', 'alpha')

    try {
      const response = await fetch(`${this.baseUrl}/jeuRecherche.php?${urlParams}`)
      
      if (!response.ok) {
        throw new Error(`Screenscraper API error: ${response.status} ${response.statusText}`)
      }

      const data: ScreenscraperGameListResponse = await response.json()
      
      if (data.error) {
        throw new Error(`Screenscraper API error: ${data.error}`)
      }

      return data.response?.jeux || []
    } catch (error) {
      console.error('Error fetching game list from Screenscraper:', error)
      return []
    }
  }

  async getGameInfo(params: {
    systemId: number
    gameId?: string
    romName?: string
    crc?: string
    md5?: string
    sha1?: string
    language?: string
  }): Promise<ScreenscraperGame | null> {
    await this.throttleRequest()

    const urlParams = this.buildAuthParams()
    urlParams.append('systemeid', params.systemId.toString())
    
    if (params.gameId) urlParams.append('gameid', params.gameId)
    if (params.romName) urlParams.append('romnom', params.romName)
    if (params.crc) urlParams.append('crc', params.crc)
    if (params.md5) urlParams.append('md5', params.md5)
    if (params.sha1) urlParams.append('sha1', params.sha1)
    if (params.language) urlParams.append('langue', params.language)

    try {
      const response = await fetch(`${this.baseUrl}/jeuInfos.php?${urlParams}`)
      
      if (!response.ok) {
        throw new Error(`Screenscraper API error: ${response.status} ${response.statusText}`)
      }

      const data: ScreenscraperResponse = await response.json()
      
      if (data.error) {
        throw new Error(`Screenscraper API error: ${data.error}`)
      }

      return data.response?.jeu || null
    } catch (error) {
      console.error('Error fetching game info from Screenscraper:', error)
      return null
    }
  }

  // Mapping des systèmes les plus courants
  static readonly SYSTEM_IDS = {
    NES: 3,
    SNES: 4,
    GAMEBOY: 9,
    GAMEBOY_COLOR: 10,
    GAMEBOY_ADVANCE: 12,
    SEGA_GENESIS: 1,
    SEGA_MASTER_SYSTEM: 2,
    NINTENDO_64: 14,
    PLAYSTATION: 57,
    PLAYSTATION_2: 58,
    ATARI_2600: 26,
    ATARI_7800: 43,
    NEO_GEO: 70,
    ARCADE: 75,
  } as const

  // Helper pour obtenir les médias par type
  static getMediaByType(game: ScreenscraperGame, type: string): string | null {
    const media = game.medias?.find(m => m.type === type)
    return media?.url || null
  }

  // Helper pour extraire les genres
  static getGenres(game: ScreenscraperGame): string[] {
    return game.genres?.map(g => g.nom) || []
  }
}

// Instance singleton pour réutiliser la configuration
let screenscraper: ScreenscraperAPI | null = null

export function getScreenscraperAPI(): ScreenscraperAPI {
  if (!screenscraper) {
    const config: ScreenscraperConfig = {
      devId: process.env.SCREENSCRAPER_DEV_ID || '',
      devPassword: process.env.SCREENSCRAPER_DEV_PASSWORD || '',
      userName: process.env.SCREENSCRAPER_USERNAME,
      userPassword: process.env.SCREENSCRAPER_PASSWORD,
    }

    if (!config.devId || !config.devPassword) {
      throw new Error('Screenscraper credentials not configured')
    }

    screenscraper = new ScreenscraperAPI(config)
  }

  return screenscraper
}

export { ScreenscraperAPI }
export type { 
  ScreenscraperGame, 
  ScreenscraperSystem,
  ScreenscraperGameListItem,
  ScreenscraperResponse,
  ScreenscraperSystemListResponse,
  ScreenscraperGameListResponse
}