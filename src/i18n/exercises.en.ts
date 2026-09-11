import type { ExerciseDictionary } from './types';

export const exercisesEn: ExerciseDictionary = {
  'warmup.circles': 'Joint circles from the neck down',
  'warmup.squats': 'Bodyweight squats',
  'warmup.lunges': 'Lunges on each leg',
  'warmup.bridges': 'Glute bridges',
  'warmup.hang': 'Relaxed hang from the bar',
  'warmup.wrists': 'Wrist circles and finger squeezes',

  'workout.warmup': 'Warm-up',
  'workout.warmup.hint':
    'The warm-up cannot be skipped: “next” unlocks when the timer runs out. Work top down — neck, shoulders, elbows, wrists, hips, knees, feet.',
  'workout.mon': 'Jump and legs',
  'workout.tue': 'Bar and grip',
  'workout.wed': 'Kick and hips',
  'workout.thu': 'Push-ups and core',
  'workout.fri': 'Measurements and light work',
  'workout.sat': 'Circuit training',
  'workout.sun': 'Recovery',
  'workout.level.beginner': 'Level: under five pull-ups',
  'workout.level.intermediate': 'Level: five to nine pull-ups',
  'workout.level.advanced': 'Level: ten and above',
  'workout.note.deload':
    'Deload week: volume is cut by 40 percent. This is part of the plan, not a concession.',
  'workout.note.deloadSoon':
    'The deload week starts in {days} days: volume will drop by 40 percent.',
  'workout.note.reduced':
    'Load reduced by 10 percent. Exercises affected: {count}. Reason — two failed sets in a row.',
  'workout.note.landings':
    'Landings this week: {done}, today plans {planned} against a limit of {budget}. Cut the jumping part.',

  'safety.arm':
    'Armwrestling: no maximal table matches without a coach and without a full warm-up — elbow and shoulder injuries happen exactly on a sharp maximal effort with a cold arm. Only isometrics and grip work here.',
  'safety.plyo':
    'Jumps: land softly on the whole foot with bent knees, on a forgiving surface only. If the knees hurt, replace jump squats with plain squats.',
  'safety.pain':
    'Sharp pain means the set stops. Press “skip” — the exercise will be marked in the log.',

  'ex.jumpSquats': 'Jump squats',
  'ex.jumpSquats.hint':
    'Knees track over the feet, land softly from toe to heel. When jump height drops, the set is over.',
  'ex.tuckJumps': 'Tuck jumps',
  'ex.tuckJumps.hint':
    'Knees come to the chest, not the chest to the knees. Back straight, land into a half squat.',
  'ex.bulgarianSplit': 'Bulgarian split squats, rear foot on a chair',
  'ex.bulgarianSplit.hint':
    'Weight on the front heel, knee stays behind the toes. Lean the torso slightly forward to load the glute.',
  'ex.calfRaises': 'Calf raises',
  'ex.calfRaises.hint':
    'Full range: stretch at the bottom, one-second pause at the top. No swinging with the torso.',
  'ex.plank': 'Plank',
  'ex.plank.hint':
    'Pelvis tucked, no arch in the lower back. Once the hips sag the set is over — holding longer is pointless.',

  'ex.australianPullups': 'Australian pull-ups',
  'ex.australianPullups.hint':
    'Body in a straight line from heels to head, chest touches the bar or the table edge. The lower the bar, the harder it gets.',
  'ex.negativePullups': 'Negative pull-ups',
  'ex.negativePullups.hint':
    'Get to the top position and lower for five controlled seconds. The eccentric is what buys the first clean rep fastest.',
  'ex.scapularPullups': 'Scapular pull-ups',
  'ex.scapularPullups.hint':
    'Arms stay straight, only the shoulder blades work: pull them down and release. A short movement, 5–10 centimetres.',
  'ex.deadHang': 'Dead hang',
  'ex.deadHang.hint':
    'Shoulders do not sink into the ears, thumb wraps the bar. Hang until the grip starts to slip.',
  'ex.flexedHang': 'Flexed-arm hang',
  'ex.flexedHang.hint':
    'Elbows near 90 degrees, no swinging. The key isometric for armwrestling: hold it still.',
  'ex.towelHang': 'Towel hang',
  'ex.towelHang.hint':
    'Towel over the bar, one end in each hand. Drop off early rather than letting the grip fail.',
  'ex.pullups': 'Pull-ups',
  'ex.pullups.hint':
    'No kipping or swinging, arms fully straight at the bottom. Only clean reps count.',
  'ex.weightedPullups': 'Weighted pull-ups',
  'ex.weightedPullups.hint':
    'Add weight only once ten clean reps come without swinging. Start at 2.5 kg.',

  'ex.jumpLunges': 'Jumping lunges',
  'ex.jumpLunges.hint': 'Switch legs in the air, land softly, the back knee never hits the floor.',
  'ex.kickSwings': 'Slow kick-motion leg swings',
  'ex.kickSwings.hint':
    'Work on range and hip rotation, no sharpness. Support leg slightly bent, torso does not fall back.',
  'ex.pistolAssisted': 'Assisted single-leg squats',
  'ex.pistolAssisted.hint':
    'Hold the support just enough to keep balance. Knee tracks the foot, heel stays down.',
  'ex.singleLegBridge': 'Single-leg hip thrust',
  'ex.singleLegBridge.hint':
    'The pelvis does not tilt toward the free leg. One-second pause at the top, glute squeezed.',
  'ex.sidePlank': 'Side plank',
  'ex.sidePlank.hint': 'Body in one line, hips do not sag, shoulder directly above the elbow.',
  'ex.ballControl': 'Ball work: control',
  'ex.ballControl.hint':
    'Receive, settle, short pass into the wall with both feet. Look ahead, not at the ball.',
  'ex.ballStrikes': 'Striking technique',
  'ex.ballStrikes.hint':
    'Support foot beside the ball, toe of the striking foot pointed, torso over the ball. Power comes from hip rotation, not from swinging the shin.',

  'ex.pushupLadder': 'Push-up ladder',
  'ex.pushupLadder.hint':
    'Rest between sets equals the rep count in seconds. Elbows at 45 degrees, body in one line.',
  'ex.diamondPushups': 'Diamond push-ups',
  'ex.diamondPushups.hint':
    'Hands under the chest, thumbs and index fingers forming a triangle. Elbows travel along the body.',
  'ex.pausePushups': 'Paused push-ups',
  'ex.pausePushups.hint':
    'Two seconds at the bottom without touching the floor, then an even press with no hip sag.',
  'ex.hangingLegRaises': 'Hanging leg raises',
  'ex.hangingLegRaises.hint':
    'If the grip fails, do lying leg raises, three sets of twelve. Lift with the abs, not with a swing.',
  'ex.bicycleCrunches': 'Bicycle crunches',
  'ex.bicycleCrunches.hint':
    'Slowly, lower back pressed to the floor. The elbow goes to the knee through the torso, not the neck.',
  'ex.hollowHold': 'Hollow hold',
  'ex.hollowHold.hint':
    'Lower back pressed to the floor is the whole point. If it lifts, raise the arms and legs higher.',

  'ex.longJumpTest': 'Standing long jump',
  'ex.longJumpTest.hint':
    'Five attempts, the best one is recorded. Measure from the line to the nearest heel contact.',
  'ex.verticalJumpTest': 'Vertical jump at the wall',
  'ex.verticalJumpTest.hint':
    'Five attempts. The result is the difference between the standing reach mark and the highest jump mark.',
  'ex.pullupsTest': 'Max pull-ups',
  'ex.pullupsTest.hint':
    'One set to failure, no swinging. The result switches the program level automatically.',
  'ex.pushupsTest': 'Max push-ups',
  'ex.pushupsTest.hint':
    'One set to failure, body in one line. A rep counts when the chest touches your fist.',
  'ex.stretching': 'Stretching',
  'ex.stretching.hint': 'No bouncing, 30 seconds per position, breathing steady.',

  'ex.circuit': 'Circuit',
  'ex.circuit.hint':
    'Four rounds back to back, 90 seconds of rest between rounds only. No pauses inside a round.',
  'ex.circuit.pullups': 'Pull-ups or Australian pull-ups',
  'ex.circuit.pushups': 'Push-ups',
  'ex.circuit.jumpSquats': 'Jump squats',
  'ex.circuit.legRaises': 'Leg raises',
  'ex.cooldown': 'Cool-down and stretching',
  'ex.cooldown.hint': 'Heart rate down, breathing even, stretch everything that worked today.',

  'ex.mobilityHips': 'Hip mobility',
  'ex.mobilityHips.hint': 'Slow hip circles, pigeon pose, hip opening. Tension only, never pain.',
  'ex.mobilityShoulders': 'Shoulder mobility',
  'ex.mobilityShoulders.hint': 'Towel dislocates, arm circles, chest stretch in a doorway.',
  'ex.hamstringStretch': 'Hamstring stretch',
  'ex.hamstringStretch.hint': 'Back straight, hinge from the hips instead of rounding the spine.',
  'ex.calfStretch': 'Calf stretch',
  'ex.calfStretch.hint': 'Heel down, knee straight; then repeat with the knee bent.',
  'ex.chestStretch': 'Chest stretch',
  'ex.chestStretch.hint': 'Forearm on the door frame, rotate the torso away. 45 seconds per side.',
  'ex.forearmStretch': 'Forearm stretch',
  'ex.forearmStretch.hint':
    'Palm on the floor, fingers toward you, shift weight gradually. Mandatory after a grip day.',
  'ex.breathing': 'Breathing drill',
  'ex.breathing.hint': 'Inhale for 4, hold for 4, exhale for 8. Belly breathing, shoulders still.',
  'ex.shower': 'Shower',
  'ex.shower.hint': 'The workout is closed. Back to the schedule.',
};
