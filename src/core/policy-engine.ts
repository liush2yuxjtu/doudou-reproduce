import type { FieldPath, PaperclipsScene, PolicyAction } from '../shared/types.js';

const valueOf = (scene: PaperclipsScene, field: keyof PaperclipsScene['fields']): number | null => {
  return scene.fields[field].value;
};

const action = (
  id: PolicyAction['id'],
  title: string,
  body: string,
  priority: number,
  requiredEvidence: FieldPath[],
  speakable = true
): PolicyAction => ({ id, title, body, priority, requiredEvidence, speakable });

export function choosePaperclipsAction(scene: PaperclipsScene): PolicyAction {
  const funds = valueOf(scene, 'funds') ?? 0;
  const inventory = valueOf(scene, 'unsoldInventory') ?? 0;
  const demand = valueOf(scene, 'publicDemand') ?? 0;
  const price = valueOf(scene, 'pricePerClip') ?? 0;
  const wire = valueOf(scene, 'wire') ?? 0;
  const wireCost = valueOf(scene, 'wireCost') ?? Number.POSITIVE_INFINITY;
  const autoClipperCost = valueOf(scene, 'autoClipperCost') ?? Number.POSITIVE_INFINITY;
  const clipsPerSecond = valueOf(scene, 'clipsPerSecond') ?? 0;

  if (scene.quality === 'low') {
    return action(
      'capture_again',
      'Capture a clearer frame',
      'I cannot read enough Paperclips state to give grounded advice yet.',
      100,
      [],
      false
    );
  }

  if (inventory >= 25 && demand <= 25 && price > 0) {
    return action(
      'lower_price',
      'Lower price before scaling output',
      'Inventory is piling up while public demand is weak, so lower price before buying more production.',
      90,
      ['fields.unsoldInventory', 'fields.publicDemand', 'fields.pricePerClip']
    );
  }

  if (wire <= 50 && funds >= wireCost) {
    return action(
      'buy_wire',
      'Buy wire before production stalls',
      'Wire is nearly gone and you have enough funds for the visible wire price.',
      80,
      ['fields.wire', 'fields.funds', 'fields.wireCost']
    );
  }

  if (clipsPerSecond === 0 && wire > 0 && inventory <= 3 && funds < autoClipperCost) {
    return action(
      'make_clips',
      'Make a few clips manually',
      'You still have wire, but there is not enough money for automation yet.',
      70,
      ['fields.wire', 'fields.unsoldInventory', 'fields.funds', 'fields.autoClipperCost']
    );
  }

  if (funds >= autoClipperCost && demand >= 65 && wire > 100 && inventory <= 10) {
    return action(
      'buy_auto_clipper',
      'Buy an AutoClipper',
      'Demand is healthy, inventory is under control, and the visible funds cover the AutoClipper cost.',
      60,
      ['fields.funds', 'fields.autoClipperCost', 'fields.publicDemand', 'fields.unsoldInventory']
    );
  }

  if (funds >= 100 && demand <= 15 && inventory <= 10) {
    return action(
      'buy_marketing',
      'Buy marketing to lift demand',
      'Demand is very low while inventory is controlled, so marketing is the next demand lever.',
      50,
      ['fields.funds', 'fields.publicDemand', 'fields.unsoldInventory']
    );
  }

  return action(
    'watch',
    'No obvious move yet',
    'The visible economy looks stable. Keep watching for demand drops, low wire, or inventory buildup.',
    10,
    ['fields.funds', 'fields.publicDemand', 'fields.wire'],
    false
  );
}
