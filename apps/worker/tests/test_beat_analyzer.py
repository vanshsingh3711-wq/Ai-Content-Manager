import pytest
from services.beat_analyzer import (
    has_number,
    list_item_count,
    LLMBeat,
    auto_repair_llm_beat_sheet,
    LLMBeatSheet
)

def test_has_number():
    assert has_number("There are 5 apples") == True
    assert has_number("A million reasons") == True
    assert has_number("Only one way") == True
    assert has_number("Zero chance") == True
    assert has_number("Some random text without digits") == False

def test_list_item_count():
    assert list_item_count("A, B, and C") >= 3
    assert list_item_count("Just A") == 1
    assert list_item_count("A, B, C, D or E") >= 4

def test_role_downgrade():
    beats = [
        LLMBeat(
            id=1, start_word_index=0, end_word_index=5,
            text="A statistic without digits.", role="statistic",
            energy="medium", key_entities=[], focus_start_word_index=0, focus_end_word_index=2,
            emphasis_words=[], concreteness="abstract", visual_potential="none"
        ),
        LLMBeat(
            id=2, start_word_index=6, end_word_index=10,
            text="A short list.", role="list",
            energy="medium", key_entities=[], focus_start_word_index=6, focus_end_word_index=8,
            emphasis_words=[], concreteness="abstract", visual_potential="none"
        )
    ]
    sheet = LLMBeatSheet(beats=beats, importance_ranking=[1, 2], language="en")
    repaired = auto_repair_llm_beat_sheet(sheet)
    
    assert repaired.beats[0].role == "claim" # statistic without number downgraded
    assert repaired.beats[1].role == "claim" # list with <3 items downgraded

    pass

from services.beat_analyzer import validate_llm_beat_sheet

def test_focus_phrase_validation():
    beats = [
        LLMBeat(
            id=1, start_word_index=0, end_word_index=3, text="of the new car",
            role="claim", energy="medium", key_entities=[], focus_start_word_index=0, focus_end_word_index=3,
            emphasis_words=[], concreteness="abstract", visual_potential="none"
        ),
        LLMBeat(
            id=2, start_word_index=4, end_word_index=7, text="Fast, furious, and fun",
            role="list", energy="medium", key_entities=[], focus_start_word_index=4, focus_end_word_index=7,
            emphasis_words=[], concreteness="abstract", visual_potential="none"
        )
    ]
    sheet = LLMBeatSheet(beats=beats, importance_ranking=[1, 2], language="en")
    
    words = [
        {"word": "Of"}, {"word": "the"}, {"word": "new"}, {"word": "car"},
        {"word": "Fast."}, {"word": "furious,"}, {"word": "and"}, {"word": "fun"}
    ]
    
    errs = validate_llm_beat_sheet(sheet, 8, words)
    assert "focus phrase must not start with a function word (got 'of')" in errs
    assert "focus phrase crosses a punctuation boundary at word index 4 ('Fast.')" in errs
