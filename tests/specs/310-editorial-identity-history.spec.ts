import { defineMedicalConsolidationTests } from '../helpers/medical-consolidation';

for (const pair of [
  { oldId: '82d7373c', newId: '82728652', oldDigest: 'sha256:f7d763644fc86dedae2a2c72acfbcad2f215c5216c2d2579bcb0a73505aa0ad0' },
  { oldId: 'c4e8b495', newId: '47ac614f', oldDigest: 'sha256:30e6f4b01cbeb0da933dc0d98f0c50899ba41579f5ee9da58d4de790f7d71028' },
  { oldId: '13e53210', newId: '40c5f770', oldDigest: 'sha256:d9875997a6a59b45052ab254e00649686a8038b4a6065ae979607a962d4ff5ae' },
  { oldId: '50166346', newId: '0334d0d1', oldDigest: 'sha256:1d4b5ad8f2bdacad8bbbfc4b25d820d112b820cf13ca583056f1d35d9d88020d' },
  { oldId: 'd10de245', newId: '51814977', oldDigest: 'sha256:fb3d2189d2dacbce038784c47c1a9b6fdb7dcdd8317dc840448c9cd37930048e' },
  { oldId: '5906012f', newId: '3d8fc3fe', oldDigest: 'sha256:4c508ac001ca2e1fef0d76c2c330ea24084bcd7f491438005573d6b5797b9dcc' },
  { oldId: 'a4ffbe05', newId: '9fd2cfdb', oldDigest: 'sha256:b2d317f00dc9a01a41da98c642ff5b7c14e3fcc350598bc8eb16aeeed923418e' },
  { oldId: 'f847386a', newId: '3a0f4a34', oldDigest: 'sha256:696e7e8bf885f7f3b5440820c70eb893f445a9c19147542c80712249515845bc' },
  { oldId: '471c0013', newId: '0a2634fc', oldDigest: 'sha256:3fa9a79805aea3503510a1aca85f4377408c633743f54f212dc7fa63d7dcdcfd' },
  { oldId: 'ea7fe551', newId: '9eafbe49', oldDigest: 'sha256:96fafb74c857bda87fb4fa29cf1c70bf3ce559a5739be6bf44c55574846aea03' },
  { oldId: '5f9a6fe1', newId: 'e56795a6', oldDigest: 'sha256:055c2c796e5447616bdb99ad5775170561c1b98bccd678254cdda7589fe0899f' },
  { oldId: 'b2c513e8', newId: '709ad94a', oldDigest: 'sha256:90fdb473d909418157c2df5ddfbdc9ba2c6cb05b62ec448faf85994d110b7d3d' },
  { oldId: 'ee219394', newId: '40c5f770', oldDigest: 'sha256:308ef4cedd93233f938cc089e6846977eaac798316cc6ec8104ca745312ac2d5' },
  { oldId: '96c0c85d', newId: '0e1a838d', oldDigest: 'sha256:69f48722cf25315a1716631fdab6ff6ab99cdb97e5aea0ebcf0b63460d8742ac' },
  { oldId: 'a5c73397', newId: '0e1a838d', oldDigest: 'sha256:1b49243816a799eb384607286a491cf1b9b64bde4bdd7add7df16f5719c8b178' },
]) defineMedicalConsolidationTests({ ...pair, release: '17.27', expectedBankCount: 723 });

defineMedicalConsolidationTests({
  oldId: '78823c61', newId: '061c9bcb', release: '17.28', expectedBankCount: 723,
  oldDigest: 'sha256:712ec869e6f012134cc8a32ed44ecc8953b24e86e6b33223c4cbe66c2a894724',
});

defineMedicalConsolidationTests({
  oldId: 'e8040054', newId: 'e1f9ccd1', release: '17.30', expectedBankCount: 723,
  oldDigest: 'sha256:d34ba7ef7bbd95e0e1ba21ca69f2845c2069e478ec043e4bb0fc3e49590b71f4',
});
