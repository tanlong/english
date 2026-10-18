#!/usr/bin/env python3
"""Draft-only lexical coverage diagnostic; never confers publication approval.

Usage:
 python scripts/check_lexical_coverage.py --text "I have a meeting at work."
 python scripts/check_lexical_coverage.py --file lesson.txt
 python scripts/check_lexical_coverage.py --text "..." --require-approved # FAIL CLOSED while seed-only

Not a scientific frequency count: lexicon entries are local editorial SEEDS until reviewed.
"""
import argparse
import json
import re
from pathlib import Path

DEFAULT = Path(__file__).resolve().parents[1] / 'data' / 'vietnam-spoken-core.seed.json'
TOKEN_RE = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
CONTRACTIONS = {"i'm":["i","am"],"you're":["you","are"],"we're":["we","are"],"they're":["they","are"],"he's":["he","is"],"she's":["she","is"],"it's":["it","is"],"that's":["that","is"],"there's":["there","is"],"don't":["do","not"],"doesn't":["does","not"],"didn't":["did","not"],"can't":["can","not"],"couldn't":["could","not"],"won't":["will","not"],"wouldn't":["would","not"],"shouldn't":["should","not"],"i'll":["i","will"],"we'll":["we","will"],"i've":["i","have"],"we've":["we","have"],"let's":["let","us"],"what's":["what","is"],"who's":["who","is"],"how's":["how","is"]}

def tokenize(text):
    for raw in TOKEN_RE.findall(text.lower()):
        yield from CONTRACTIONS.get(raw, [raw])

def main():
    ap = argparse.ArgumentParser()
    inp = ap.add_mutually_exclusive_group(required=True)
    inp.add_argument('--text')
    inp.add_argument('--file', type=Path)
    ap.add_argument('--lexicon', type=Path, default=DEFAULT)
    ap.add_argument('--require-approved', action='store_true', help='production-mode gate: reject unapproved lexicons')
    args = ap.parse_args()
    data = json.loads(args.lexicon.read_text(encoding='utf-8'))
    if args.require_approved and (data.get('status') != 'approved' or not data.get('empirically_validated') or not data.get('may_drive_publish_gate')):
        print('BLOCKED: vocabulary resource has not passed human evidence review and approval. No production score issued.')
        return 3
    text = args.text if args.text is not None else args.file.read_text(encoding='utf-8')
    words = list(tokenize(text))
    # For real production: use an editorially approved tokenizer + inflection mapper;
    # literal lemma matching can undercount. Avoid pretending otherwise.
    approved = {x['lemma'] for x in data['entries'] if x.get('review_status') == 'approved'}
    candidate = {x['lemma'] for x in data['entries']}
    use = approved if args.require_approved else candidate
    covered = sum(w in use for w in words)
    uncovered = sorted(set(w for w in words if w not in use))
    r = covered / len(words) if words else 0.0
    status = 'APPROVED' if args.require_approved else 'CANDIDATE_ONLY_NOT_VALIDATED'
    print(json.dumps({'status':status,'lexicon_id':data['lexicon_id'],'version':data['version'],
                      'eligible_tokens':len(words),'covered_tokens':covered,'candidate_ratio':round(r,4),
                      'uncovered_token_types':uncovered,
                      'caveat':'Candidate match is NOT production editorial approval; no frequency claim.'},
                     ensure_ascii=False,indent=2))
    return 0 if not args.require_approved else (0 if r >= 0.9 else 4)

if __name__ == '__main__':
    raise SystemExit(main())
