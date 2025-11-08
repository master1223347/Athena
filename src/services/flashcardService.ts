import { supabase } from '@/integrations/supabase/client';
import { ParsedFlashcard } from '@/utils/flashcardParser';

export interface SavedFlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  flashcards: ParsedFlashcard[];
  created_at: string;
  updated_at: string;
  study_count: number;
  last_studied?: string;
}

export interface CreateDeckRequest {
  title: string;
  description?: string;
  flashcards: ParsedFlashcard[];
}

class FlashcardService {
  /**
   * Save a new flashcard deck
   */
  async saveDeck(userId: string, deckData: CreateDeckRequest): Promise<SavedFlashcardDeck> {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id: userId,
        title: deckData.title,
        description: deckData.description,
        flashcards: deckData.flashcards,
        study_count: 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save flashcard deck: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all flashcard decks for a user
   */
  async getUserDecks(userId: string): Promise<SavedFlashcardDeck[]> {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch flashcard decks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific flashcard deck
   */
  async getDeck(deckId: string): Promise<SavedFlashcardDeck | null> {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('id', deckId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Deck not found
      }
      throw new Error(`Failed to fetch flashcard deck: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a flashcard deck
   */
  async updateDeck(deckId: string, updates: Partial<CreateDeckRequest>): Promise<SavedFlashcardDeck> {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', deckId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update flashcard deck: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a flashcard deck
   */
  async deleteDeck(deckId: string): Promise<void> {
    const { error } = await supabase
      .from('flashcard_decks')
      .delete()
      .eq('id', deckId);

    if (error) {
      throw new Error(`Failed to delete flashcard deck: ${error.message}`);
    }
  }

  /**
   * Record a study session
   */
  async recordStudySession(deckId: string): Promise<void> {
    const { error } = await supabase
      .from('flashcard_decks')
      .update({
        study_count: supabase.raw('study_count + 1'),
        last_studied: new Date().toISOString()
      })
      .eq('id', deckId);

    if (error) {
      throw new Error(`Failed to record study session: ${error.message}`);
    }
  }

  /**
   * Export flashcard deck as JSON
   */
  exportDeckAsJSON(deck: SavedFlashcardDeck): string {
    const exportData = {
      title: deck.title,
      description: deck.description,
      flashcards: deck.flashcards,
      exported_at: new Date().toISOString(),
      total_cards: deck.flashcards.length
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export flashcard deck as CSV
   */
  exportDeckAsCSV(deck: SavedFlashcardDeck): string {
    const headers = ['Question', 'Answer', 'Index'];
    const rows = deck.flashcards.map(card => [
      `"${card.question.replace(/"/g, '""')}"`,
      `"${card.answer.replace(/"/g, '""')}"`,
      card.index.toString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Import flashcard deck from JSON
   */
  async importDeckFromJSON(userId: string, jsonData: string, title?: string): Promise<SavedFlashcardDeck> {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.flashcards || !Array.isArray(data.flashcards)) {
        throw new Error('Invalid flashcard data format');
      }

      return await this.saveDeck(userId, {
        title: title || data.title || 'Imported Deck',
        description: data.description,
        flashcards: data.flashcards
      });
    } catch (error) {
      throw new Error(`Failed to import flashcard deck: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }
}

export const flashcardService = new FlashcardService();
