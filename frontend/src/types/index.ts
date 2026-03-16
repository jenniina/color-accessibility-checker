import { ReactNode } from 'react'

export interface RefObject<T> {
  readonly current: T | null
}

export const breakpoint = 700
export const breakpointSmall = 400

export interface AppProps {
  // pageContext is provided during server render by +onRenderHtml
  pageContext: {
    urlPathname?: string | undefined
  }
}

export interface IContent {
  success: boolean
  user: IUser
  message: string
}

export interface IResponse {
  success: boolean
  message: string
}

export interface IToken extends IResponse {
  token?: string
}

export interface credentials {
  username: string
  password: string
  language: string
}

export enum ELanguages {
  en = 'en',
  fi = 'fi',
  es = 'es',
  fr = 'fr',
  de = 'de',
  pt = 'pt',
  cs = 'cs',
}
export enum ELanguagesLong {
  en = 'English',
  fi = 'Suomi',
  es = 'Español',
  fr = 'Français',
  de = 'Deutch',
  pt = 'Português',
  cs = 'Čeština',
}
export enum ELanguageTitle {
  en = 'Language',
  es = 'Idioma',
  fr = 'Langue',
  de = 'Sprache',
  pt = 'Língua',
  cs = 'Jazyk',
  fi = 'Kieli',
}

export type EGeneric<T> = {
  [key in keyof T]: T[key]
}

export const LanguageOfLanguage: ILanguageOfLanguage = {
  en: {
    English: 'English',
    Español: 'Spanish',
    Français: 'French',
    Deutch: 'German',
    Português: 'Portuguese',
    Čeština: 'Czech',
    Suomi: 'Finnish',
  },
  es: {
    English: 'Inglés',
    Español: 'Español',
    Français: 'Francés',
    Deutch: 'Alemán',
    Português: 'Portugués',
    Čeština: 'Checo',
    Suomi: 'Finlandés',
  },
  fr: {
    English: 'Anglais',
    Español: 'Espagnol',
    Français: 'Français',
    Deutch: 'Allemand',
    Português: 'Portugais',
    Čeština: 'Tchèque',
    Suomi: 'Finnois',
  },
  de: {
    English: 'Englisch',
    Español: 'Spanisch',
    Français: 'Französisch',
    Deutch: 'Deutsch',
    Português: 'Portugiesisch',
    Čeština: 'Tschechisch',
    Suomi: 'Finnisch',
  },
  pt: {
    English: 'Inglês',
    Español: 'Espanhol',
    Français: 'Francês',
    Deutch: 'Alemão',
    Português: 'Português',
    Čeština: 'Tcheco',
    Suomi: 'Finlandês',
  },
  cs: {
    English: 'Angličtina',
    Español: 'Španělština',
    Français: 'Francouzština',
    Deutch: 'Němčina',
    Português: 'Portugalština',
    Čeština: 'Čeština',
    Suomi: 'Finština',
  },
  fi: {
    English: 'Englanti',
    Español: 'Espanja',
    Français: 'Ranska',
    Deutch: 'Saksa',
    Português: 'Portugali',
    Čeština: 'Tšekki',
    Suomi: 'Suomi',
  },
}

export interface ILanguageOfLanguage {
  en: {
    English: 'English'
    Español: 'Spanish'
    Français: 'French'
    Deutch: 'German'
    Português: 'Portuguese'
    Čeština: 'Czech'
    Suomi: 'Finnish'
  }
  es: {
    English: 'Inglés'
    Español: 'Español'
    Français: 'Francés'
    Deutch: 'Alemán'
    Português: 'Portugués'
    Čeština: 'Checo'
    Suomi: 'Finlandés'
  }
  fr: {
    English: 'Anglais'
    Español: 'Espagnol'
    Français: 'Français'
    Deutch: 'Allemand'
    Português: 'Portugais'
    Čeština: 'Tchèque'
    Suomi: 'Finnois'
  }
  de: {
    English: 'Englisch'
    Español: 'Spanisch'
    Français: 'Französisch'
    Deutch: 'Deutsch'
    Português: 'Portugiesisch'
    Čeština: 'Tschechisch'
    Suomi: 'Finnisch'
  }
  pt: {
    English: 'Inglês'
    Español: 'Espanhol'
    Français: 'Francês'
    Deutch: 'Alemão'
    Português: 'Português'
    Čeština: 'Tcheco'
    Suomi: 'Finlandês'
  }
  cs: {
    English: 'Angličtina'
    Español: 'Španělština'
    Français: 'Francouzština'
    Deutch: 'Němčina'
    Português: 'Portugalština'
    Čeština: 'Čeština'
    Suomi: 'Finština'
  }
  fi: {
    English: 'Englanti'
    Español: 'Espanja'
    Français: 'Ranska'
    Deutch: 'Saksa'
    Português: 'Portugali'
    Čeština: 'Tšekki'
    Suomi: 'Suomi'
  }
}

export interface ILanguageOfLanguage {
  en: {
    English: 'English'
    Español: 'Spanish'
    Français: 'French'
    Deutch: 'German'
    Português: 'Portuguese'
    Čeština: 'Czech'
    Suomi: 'Finnish'
  }
  es: {
    English: 'Inglés'
    Español: 'Español'
    Français: 'Francés'
    Deutch: 'Alemán'
    Português: 'Portugués'
    Čeština: 'Checo'
    Suomi: 'Finlandés'
  }
  fr: {
    English: 'Anglais'
    Español: 'Espagnol'
    Français: 'Français'
    Deutch: 'Allemand'
    Português: 'Portugais'
    Čeština: 'Tchèque'
    Suomi: 'Finnois'
  }
  de: {
    English: 'Englisch'
    Español: 'Spanisch'
    Français: 'Französisch'
    Deutch: 'Deutsch'
    Português: 'Portugiesisch'
    Čeština: 'Tschechisch'
    Suomi: 'Finnisch'
  }
  pt: {
    English: 'Inglês'
    Español: 'Espanhol'
    Français: 'Francês'
    Deutch: 'Alemão'
    Português: 'Português'
    Čeština: 'Tcheco'
    Suomi: 'Finlandês'
  }
  cs: {
    English: 'Angličtina'
    Español: 'Španělština'
    Français: 'Francouzština'
    Deutch: 'Němčina'
    Português: 'Portugalština'
    Čeština: 'Čeština'
    Suomi: 'Finština'
  }
  fi: {
    English: 'Englanti'
    Español: 'Espanja'
    Français: 'Ranska'
    Deutch: 'Saksa'
    Português: 'Portugali'
    Čeština: 'Tšekki'
    Suomi: 'Suomi'
  }
}

export enum ELanguageOfLanguage_en {
  English = 'English',
  Español = 'Spanish',
  Français = 'French',
  Deutch = 'German',
  Português = 'Portuguese',
  Čeština = 'Czech',
  Suomi = 'Finnish',
}
export enum ELanguageOfLanguage_es {
  English = 'Inglés',
  Español = 'Español',
  Français = 'Francés',
  Deutch = 'Alemán',
  Português = 'Portugués',
  Čeština = 'Checo',
  Suomi = 'Finlandés',
}
export enum ELanguageOfLanguage_fr {
  English = 'Anglais',
  Español = 'Espagnol',
  Français = 'Français',
  Deutch = 'Allemand',
  Português = 'Portugais',
  Čeština = 'Tchèque',
  Suomi = 'Finnois',
}
export enum ELanguageOfLanguage_de {
  English = 'Englisch',
  Español = 'Spanisch',
  Français = 'Französisch',
  Deutch = 'Deutsch',
  Português = 'Portugiesisch',
  Čeština = 'Tschechisch',
  Suomi = 'Finnisch',
}
export enum ELanguageOfLanguage_pt {
  English = 'Inglês',
  Español = 'Espanhol',
  Français = 'Francês',
  Deutch = 'Alemão',
  Português = 'Português',
  Čeština = 'Tcheco',
  Suomi = 'Finlandês',
}
export enum ELanguageOfLanguage_cs {
  English = 'Angličtina',
  Español = 'Španělština',
  Français = 'Francouzština',
  Deutch = 'Němčina',
  Português = 'Portugalština',
  Čeština = 'Čeština',
  Suomi = 'Finština',
}
export enum ELanguageOfLanguage_fi {
  English = 'Englanti',
  Español = 'Espanja',
  Français = 'Ranska',
  Deutch = 'Saksa',
  Português = 'Portugali',
  Čeština = 'Tšekki',
  Suomi = 'Suomi',
}
export interface ELanguageOfLanguage {
  en: ELanguageOfLanguage_en
  es: ELanguageOfLanguage_es
  fr: ELanguageOfLanguage_fr
  de: ELanguageOfLanguage_de
  pt: ELanguageOfLanguage_pt
  cs: ELanguageOfLanguage_cs
  fi: ELanguageOfLanguage_fi
}

export interface IUser {
  _id?: string
  username: string
  name?: string
  role?: number
  password: string
  passwordOld?: string
  language: ELanguages | string
  verified?: boolean
  createdAt?: string
  updatedAt?: string
  blacklistedJokes?: IBlacklistedJoke[]
  colorAccessibility?: {
    colors: unknown[]
    currentColor?: string
    mode?: string
    updatedAt?: string
  }
}

export interface IPublicUserName {
  _id: string
  name: string
}

export type TPublicUserNamesMap = Record<string, string>

export interface IQuiz {
  id: string
  name: string
  description: string
  questions: IQuestion[]
}
export enum EQuizType {
  easy = 'easy',
  medium = 'medium',
  hard = 'hard',
}

export type TQuizModes = 'easy' | 'medium' | 'hard'

export interface IQuizHighscore {
  highscores: IHighscore
  user: IUser['_id']
}
export interface IHighscore {
  easy: { score: number; time: number }
  medium: { score: number; time: number }
  hard: { score: number; time: number }
}
export interface IQuestion {
  id: string
  title: string
  options: string[]
  question: {
    text: string
  }
  correctAnswer: string
  incorrectAnswers: string[]
}

export type TPriority = 'all' | 'low' | 'medium' | 'high'

export type TCategory = 'all' | 'work' | 'personal' | 'shopping' | 'other'

export type TSortOptions =
  | 'none'
  | 'text'
  | 'priority'
  | 'deadline'
  | 'category'

export interface ITask {
  key: string
  name: string
  complete: boolean
  order: number
  user?: IUser['_id'] | null
  priority: TPriority
  deadline: string
  category: TCategory
  createdAt?: string
  updatedAt?: string
}

export interface ITodos {
  user?: IUser['_id'] | null
  todos: ITask[]
}
export interface TodosState {
  todos: ITask[]
  status: 'idle' | 'loading' | 'failed'
  error: string | null
}

export interface ICartItem {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  details?: string
}

export type paid = 'full' | 'partial' | 'none'
export type status = 'pending' | 'in progress' | 'completed' | 'cancelled'

export interface IInfo {
  email: string
  name: string
  companyName?: string
  businessID?: string
  zip: string
  city: string
  address: string
  country: string
  phone?: string
}

export interface ICart {
  _id?: string
  orderID: string
  info: IInfo
  items: ICartItem[]
  total: number
  extra?: string
  paid: paid
  status: status
  createdAt: Date
  updatedAt?: Date
}

export enum EJokeType {
  single = 'single',
  twopart = 'twopart',
}

export enum ECategories {
  Misc = 'Misc',
  Programming = 'Programming',
  Dark = 'Dark',
  Pun = 'Pun',
  Spooky = 'Spooky',
  Christmas = 'Christmas',
  ChuckNorris = 'ChuckNorris',
  DadJoke = 'DadJoke',
}

export interface IJokeCommonFields {
  _id?: string
  id?: string | undefined
  jokeId: string
  type: EJokeType
  category: ECategories
  subCategories: string[] | undefined
  language: ELanguages
  safe: boolean
  user: IUser['_id'][]
  flags: {
    nsfw: boolean
    religious: boolean
    political: boolean
    racist: boolean
    sexist: boolean
    explicit: boolean
  }
  private?: boolean // only for submitted jokes
  verified?: boolean
  anonymous?: boolean
  author?: IUser['_id']
  createdAt?: string
  updatedAt?: string
}

export interface IJokeSingle extends IJokeCommonFields {
  type: EJokeType.single
  joke: string
}

export interface IJokeTwoPart extends IJokeCommonFields {
  type: EJokeType.twopart
  setup: string
  delivery: string
}

export type IJoke = IJokeSingle | IJokeTwoPart

export interface IBlacklistedJoke {
  jokeId: IJoke['jokeId']
  language: ELanguages
  value?: string
  _id?: string
}

export interface ReducerProps {
  jokes: {
    jokes: IJoke[]
    joke: IJoke | null
  }
  notification: {
    isError: boolean
    message: string
    seconds: number
  }
  difficulty: {
    mode: EQuizType
  }
  cache: IJoke | null
  quiz: {
    quiz: IQuiz
    quizzes: IQuiz[]
  }
  questions: {
    questionsRedux: IQuestion[]
    status: string
    index: number
    currentQuestion: {
      id?: string
      question?: string
      options?: string[]
      // correctAnswer can be either the answer string (multiple choice) or a boolean for true/false questions
      correctAnswer?: string | boolean
      temp?: {
        correctAnswer?: boolean
        incorrectAnswers?: boolean[]
      }
    }
    answer: string | null
    points: number
    highscores: IHighscore
    secondsRemaining: number
    finalSeconds: number
  }
  users: IUser[]

  auth: {
    user: IUser
    isAuthenticated: boolean
    isLoading: boolean
    token: string
  }
  todos: ITodos
  cart: ICart
}

export interface ModalProps {
  children: ReactNode
  className: string
  title: string
}

export type TSortDirection = 'asc' | 'desc'
