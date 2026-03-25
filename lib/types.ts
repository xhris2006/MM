export type Category = 'miss' | 'master'

export interface Candidate {
  id: string
  name: string
  slug?: string | null
  description: string
  photo_url: string | null
  category: Category
  promotion: string
  vote_count: number
  created_at: string
}

export interface Vote {
  id: string
  user_id: string
  candidate_id: string
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  has_voted_miss: boolean
  has_voted_master: boolean
  created_at: string
}
