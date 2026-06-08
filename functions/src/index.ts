import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();
const db = getFirestore();

const SCORING = { EXACT_RESULT: 10, CORRECT_OUTCOME: 4, CHAMPION_WINNER: 100 };

function outcome(home: number, away: number): '1' | 'X' | '2' {
  if (home > away) return '1';
  if (home < away) return '2';
  return 'X';
}

async function requireAdmin(uid: string): Promise<void> {
  const user = await db.collection('users').doc(uid).get();
  if (!user.exists || user.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo admin.');
  }
}

export const savePrediction = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Devi essere autenticato.');
  const uid = request.auth.uid;
  const { matchId, homeGoals, awayGoals } = request.data ?? {};

  if (typeof matchId !== 'string' || typeof homeGoals !== 'number' || typeof awayGoals !== 'number') {
    throw new HttpsError('invalid-argument', 'Dati pronostico non validi.');
  }
  if (homeGoals < 0 || awayGoals < 0 || homeGoals > 30 || awayGoals > 30) {
    throw new HttpsError('invalid-argument', 'Risultato non valido.');
  }

  const matchSnap = await db.collection('matches').doc(matchId).get();
  if (!matchSnap.exists) throw new HttpsError('not-found', 'Partita non trovata.');
  const match = matchSnap.data()!;
  const kickoffAt = match.kickoffAt as Timestamp;
  const lockMs = kickoffAt.toMillis() - 5 * 60 * 1000;

  if (Date.now() >= lockMs || match.status !== 'scheduled') {
    throw new HttpsError('failed-precondition', 'Pronostico bloccato.');
  }

  const predictionId = `${uid}_${matchId}`;
  await db.collection('predictions').doc(predictionId).set({
    id: predictionId,
    uid,
    matchId,
    predictedHomeGoals: homeGoals,
    predictedAwayGoals: awayGoals,
    points: 0,
    exactResult: false,
    correctOutcome: false,
    lockedAt: Timestamp.fromMillis(lockMs),
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true };
});

export const recalculateScores = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Devi essere autenticato.');
  await requireAdmin(request.auth.uid);

  const [usersSnap, matchesSnap, predictionsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('matches').where('status', '==', 'finished').get(),
    db.collection('predictions').get()
  ]);

  const matches = new Map<string, FirebaseFirestore.DocumentData>();
  matchesSnap.forEach(doc => matches.set(doc.id, doc.data()));

  const stats = new Map<string, { points: number; exact: number; outcomes: number }>();
  usersSnap.forEach(doc => stats.set(doc.id, { points: 0, exact: 0, outcomes: 0 }));

  predictionsSnap.forEach(doc => {
    const p = doc.data();
    const m = matches.get(p.matchId);
    if (!m) return;
    const exact = p.predictedHomeGoals === m.officialHomeGoals && p.predictedAwayGoals === m.officialAwayGoals;
    const correctOutcome = outcome(p.predictedHomeGoals, p.predictedAwayGoals) === outcome(m.officialHomeGoals, m.officialAwayGoals);
    const points = exact ? SCORING.EXACT_RESULT : correctOutcome ? SCORING.CORRECT_OUTCOME : 0;
    const current = stats.get(p.uid) ?? { points: 0, exact: 0, outcomes: 0 };
    current.points += points;
    if (exact) current.exact += 1;
    else if (correctOutcome) current.outcomes += 1;
    stats.set(p.uid, current);
    doc.ref.update({ points, exactResult: exact, correctOutcome, updatedAt: FieldValue.serverTimestamp() });
  });

  // Bonus vincente Mondiale: viene applicato quando la finale è finished e si valorizza settings/worldCup.winner.
  const settings = await db.collection('settings').doc('worldCup').get();
  const winner = settings.data()?.winner as string | undefined;

  const batch = db.batch();
  usersSnap.forEach(doc => {
    const user = doc.data();
    const s = stats.get(doc.id) ?? { points: 0, exact: 0, outcomes: 0 };
    let total = s.points;
    const championBonusAwarded = Boolean(winner && user.championPick === winner);
    if (championBonusAwarded) total += SCORING.CHAMPION_WINNER;
    batch.update(doc.ref, {
      points: total,
      exactResults: s.exact,
      correctOutcomes: s.outcomes,
      championBonusAwarded,
      updatedAt: FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
  return { success: true };
});
