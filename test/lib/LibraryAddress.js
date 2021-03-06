const { bN, testAddresses, emptyAddress } = require('../testHelpers');

const TestLibraryAddress = artifacts.require('./TestLibraryAddress.sol');

contract('TestLibraryAddress', function () {
  let testLibraryAddress;

  const resetDataBeforeTest = async function () {
    testLibraryAddress = await TestLibraryAddress.new();
    await testLibraryAddress.setup_data_for_testing();
  };

  beforeEach(resetDataBeforeTest);

  describe('find', function () {
    beforeEach(resetDataBeforeTest);
    it('returns correct index if item is found', async function () {
      assert.deepEqual(await testLibraryAddress.test_find.call(testAddresses[4]), bN(4));
    });
    it('returns 0 if item is not found', async function () {
      assert.deepEqual(await testLibraryAddress.test_find.call(testAddresses[0]), bN(0));
    });
    it('returns 0 if data is empty (no items at all)', async function () {
      await testLibraryAddress.setup_reset_data();
      assert.deepEqual(await testLibraryAddress.test_find.call(testAddresses[0]), bN(0));
    });
  });

  describe('get', function () {
    beforeEach(resetDataBeforeTest);
    it('returns correct item if index is valid', async function () {
      assert.deepEqual(await testLibraryAddress.test_get.call(bN(6)), testAddresses[6]);
      assert.deepEqual(await testLibraryAddress.test_get.call(bN(4)), testAddresses[4]);
    });
    it('returns empty address(0) if index is already deleted', async function () {
      await testLibraryAddress.test_remove(bN(3));
      assert.deepEqual(await testLibraryAddress.test_get.call(bN(3)), emptyAddress);
    });
    it('returns empty address(0) if index is 0 (invalid)', async function () {
      assert.deepEqual(await testLibraryAddress.test_get.call(bN(0)), emptyAddress);
    });
    it('returns empty address(0) if index is more than last_index (invalid)', async function () {
      assert.deepEqual(await testLibraryAddress.test_get.call(bN(7)), emptyAddress);
    });
  });

  describe('append', function () {
    beforeEach(resetDataBeforeTest);
    it('[item already exists]: returns false', async function () {
      assert.deepEqual(await testLibraryAddress.test_append.call(testAddresses[4]), false);
    });
    it('[item is new, collection is not empty]: last_index and count are updated correctly,', async function () {
      assert.deepEqual(await testLibraryAddress.test_append.call(testAddresses[7]), true);
      await testLibraryAddress.test_append(testAddresses[7]);
      assert.deepEqual(await testLibraryAddress.test_check_last_index.call(), bN(7));
      assert.deepEqual(await testLibraryAddress.test_check_count.call(), bN(7));
    });
    it('[item is new]: item added is at last_index, items content and pointers are correct', async function () {
      await testLibraryAddress.test_append(testAddresses[8]);
      // make sure we just added to index 7
      assert.deepEqual(await testLibraryAddress.test_get.call(bN(7)), testAddresses[8]);
      // (last item).previous_index should be 6 now;
      assert.deepEqual(await testLibraryAddress.test_item_previous_index.call(bN(7)), bN(6));
      // //(last item).next_index should be 0
      assert.deepEqual(await testLibraryAddress.test_item_next_index.call(bN(7)), bN(0));
    });
    it('[item is new, collection is empty]: first_index, last_index and count are set to 1,', async function () {
      await testLibraryAddress.setup_reset_data();
      await testLibraryAddress.test_append(testAddresses[9]);
      assert.deepEqual(await testLibraryAddress.test_check_first_index.call(), bN(1));
      assert.deepEqual(await testLibraryAddress.test_check_last_index.call(), bN(1));
      assert.deepEqual(await testLibraryAddress.test_check_count.call(), bN(1));
    });
    it('[item is empty address]: return false, doesn\'t do anything', async function () {
      await testLibraryAddress.setup_reset_data();
      assert.deepEqual(await testLibraryAddress.test_append.call(emptyAddress), false);
      await testLibraryAddress.test_append(emptyAddress);
      assert.deepEqual(await testLibraryAddress.test_check_count.call(), bN(0));
    });
  });

  describe('remove', function () {
    beforeEach(resetDataBeforeTest);
    it('[index = 1]: removes the first item, first_index changes correctly, (new first item).previous_index = 0, count is updated, returns true', async function () {
      assert.deepEqual(await testLibraryAddress.test_remove.call(bN(1)), true);
      await testLibraryAddress.test_remove(bN(1));
      assert.deepEqual(await testLibraryAddress.test_check_first_index.call(), bN(2));
      assert.deepEqual(await testLibraryAddress.test_item_previous_index.call(bN(2)), bN(0));
      assert.deepEqual(await testLibraryAddress.test_check_count.call(), bN(5));
    });
    it('[index = last_index]: removes the last item, last_index changes correctly, (new last item).next_index = 0, count is updated, returns true', async function () {
      assert.deepEqual(await testLibraryAddress.test_remove.call(bN(6)), true);
      await testLibraryAddress.test_remove(bN(6));
      assert.deepEqual(await testLibraryAddress.test_check_last_index.call(), bN(5));
      assert.deepEqual(await testLibraryAddress.test_item_next_index.call(bN(5)), bN(0));
      assert.deepEqual(await testLibraryAddress.test_check_count.call(), bN(5));
    });
    it('[1 < index < last_index]: removes correct item, previous_index and next_index of surrouding items are updated correctly, count is updated, returns true', async function () {
      assert.deepEqual(await testLibraryAddress.test_remove.call(bN(4)), true);
      await testLibraryAddress.test_remove(bN(4));
      assert.deepEqual(await testLibraryAddress.test_item_next_index.call(bN(3)), bN(5));
      assert.deepEqual(await testLibraryAddress.test_item_previous_index.call(bN(5)), bN(3));
      assert.deepEqual(await testLibraryAddress.test_check_count.call(), bN(5));
    });
    it('[index is already removed]: doesnt do anything, count is the same, returns false', async function () {
      await testLibraryAddress.test_remove(bN(4));
      assert.deepEqual(await testLibraryAddress.test_remove.call(bN(4)), false);
      await testLibraryAddress.test_remove(bN(4));
      assert.deepEqual(await testLibraryAddress.test_check_count.call(), bN(5));
    });
    it('[index=0 - invalid]: no item should be removed, count is unchanged, returns false', async function () {
      assert.deepEqual(await testLibraryAddress.test_remove.call(bN(0)), false);
      await testLibraryAddress.test_remove(bN(0));
      assert.deepEqual(await testLibraryAddress.test_check_count.call(), bN(6));
    });
    it('[index>last_index - invalid]: no item should be removed, count is unchanged, returns false', async function () {
      assert.deepEqual(await testLibraryAddress.test_remove.call(bN(7)), false);
      await testLibraryAddress.test_remove(bN(7));
      assert.deepEqual(await testLibraryAddress.test_check_count.call(), bN(6));
    });
  });

  describe('remove_item', function () {
    beforeEach(resetDataBeforeTest);
    it('[item exists]: remove the item, count decrements by 1, returns true', async function () {
      assert.deepEqual(await testLibraryAddress.test_remove_item.call(testAddresses[2]), true);
      await testLibraryAddress.test_remove_item(testAddresses[2]);
      assert.deepEqual(await testLibraryAddress.test_check_count.call(), bN(5));
      assert.deepEqual(await testLibraryAddress.test_find.call(testAddresses[2]), bN(0));
    });
    it('[item does not exist]: count is the same, returns false', async function () {
      assert.deepEqual(await testLibraryAddress.test_remove_item.call(testAddresses[10]), false);
      await testLibraryAddress.test_remove_item(testAddresses[10]);
      assert.deepEqual(await testLibraryAddress.test_check_count.call(), bN(6));
    });
  });

  describe('total', function () {
    beforeEach(resetDataBeforeTest);
    it('[collection is not empty]: returns correct count', async function () {
      assert.deepEqual(await testLibraryAddress.test_total.call(), bN(6));
    });
    it('[collection is empty]: returns 0', async function () {
      await testLibraryAddress.setup_reset_data();
      assert.deepEqual(await testLibraryAddress.test_total.call(), bN(0));
    });
  });

  describe('start', function () {
    beforeEach(resetDataBeforeTest);
    it('[collection is not empty]: returns correct first_index', async function () {
      assert.deepEqual(await testLibraryAddress.test_start.call(), bN(1));
    });
    it('[collection is empty]: returns 0', async function () {
      await testLibraryAddress.setup_reset_data();
      assert.deepEqual(await testLibraryAddress.test_start.call(), bN(0));
    });
  });

  describe('start_item', function () {
    beforeEach(resetDataBeforeTest);
    it('[collection is not empty]: returns correct item', async function () {
      assert.deepEqual(await testLibraryAddress.test_start_item.call(), testAddresses[1]);
    });
    it('[collection is empty]: returns empty address(0)', async function () {
      await testLibraryAddress.setup_reset_data();
      assert.deepEqual(await testLibraryAddress.test_start_item.call(), emptyAddress);
    });
  });

  describe('end', function () {
    beforeEach(resetDataBeforeTest);
    it('[collection is not empty]: returns correct last_index', async function () {
      assert.deepEqual(await testLibraryAddress.test_end.call(), bN(6));
    });
    it('[collection is empty]: returns 0', async function () {
      await testLibraryAddress.setup_reset_data();
      assert.deepEqual(await testLibraryAddress.test_end.call(), bN(0));
    });
  });

  describe('end_item', function () {
    beforeEach(resetDataBeforeTest);
    it('[collection is not empty]: returns correct item', async function () {
      assert.deepEqual(await testLibraryAddress.test_end_item.call(), testAddresses[6]);
    });
    it('[collection is empty]: returns empty address(0)', async function () {
      await testLibraryAddress.setup_reset_data();
      assert.deepEqual(await testLibraryAddress.test_end_item.call(), emptyAddress);
    });
  });

  describe('valid', function () {
    beforeEach(resetDataBeforeTest);
    it('[index = 0]: returns false', async function () {
      assert.deepEqual(await testLibraryAddress.test_valid.call(bN(0)), false);
    });
    it('[index > last_index]: returns false', async function () {
      assert.deepEqual(await testLibraryAddress.test_valid.call(bN(7)), false);
    });
    it('[0< index < last_index]: returns true', async function () {
      assert.deepEqual(await testLibraryAddress.test_valid.call(bN(3)), true);
    });
  });

  describe('valid_item', function () {
    beforeEach(resetDataBeforeTest);
    it('[item is in the collection]: returns true', async function () {
      assert.deepEqual(await testLibraryAddress.test_valid_item.call(testAddresses[2]), true);
    });
    it('[item is not in the collection]: returns false', async function () {
      assert.deepEqual(await testLibraryAddress.test_valid_item.call(testAddresses[11]), false);
    });
  });

  describe('previous', function () {
    beforeEach(resetDataBeforeTest);
    it('[first_index < index <= last_index]: returns correct previous index', async function () {
      assert.deepEqual(await testLibraryAddress.test_previous.call(bN(4)), bN(3));
    });
    it('[index = first_index]: returns 0', async function () {
      assert.deepEqual(await testLibraryAddress.test_previous.call(bN(1)), bN(0));
    });
    it('[index < first_index (invalid) ]: returns 0', async function () {
      assert.deepEqual(await testLibraryAddress.test_previous.call(bN(0)), bN(0));
    });
    it('[index > last_index  (invalid) ]: returns 0', async function () {
      assert.deepEqual(await testLibraryAddress.test_previous.call(bN(7)), bN(0));
    });
  });

  describe('previous_item', function () {
    beforeEach(resetDataBeforeTest);
    it('[item is in the collection, not the first]: returns correct previous item', async function () {
      assert.deepEqual(await testLibraryAddress.test_previous_item.call(testAddresses[5]), testAddresses[4]);
    });
    it('[item is the first in the collection]: returns empty address(0)', async function () {
      assert.deepEqual(await testLibraryAddress.test_previous_item.call(testAddresses[1]), emptyAddress);
    });
    it('[item is not in the collection]: returns empty address(0)', async function () {
      assert.deepEqual(await testLibraryAddress.test_previous_item.call(testAddresses[12]), emptyAddress);
    });
  });

  describe('next', function () {
    beforeEach(resetDataBeforeTest);
    it('[first_index <= index < last_index]: returns correct next index', async function () {
      assert.deepEqual(await testLibraryAddress.test_next.call(bN(4)), bN(5));
    });
    it('[index = last_index]: returns 0', async function () {
      assert.deepEqual(await testLibraryAddress.test_next.call(bN(6)), bN(0));
    });
    it('[index < first_index (invalid) ]: returns 0', async function () {
      assert.deepEqual(await testLibraryAddress.test_next.call(bN(0)), bN(0));
    });
    it('[index > last_index  (invalid) ]: returns 0', async function () {
      assert.deepEqual(await testLibraryAddress.test_next.call(bN(7)), bN(0));
    });
  });

  describe('next_item', function () {
    beforeEach(resetDataBeforeTest);
    it('[item is in the collection, not the last]: returns correct next item', async function () {
      assert.deepEqual(await testLibraryAddress.test_next_item.call(testAddresses[5]), testAddresses[6]);
    });
    it('[item is the last in the collection]: returns empty address(0)', async function () {
      assert.deepEqual(await testLibraryAddress.test_next_item.call(testAddresses[6]), emptyAddress);
    });
    it('[item is not in the collection]: returns empty address(0)', async function () {
      assert.deepEqual(await testLibraryAddress.test_next_item.call(testAddresses[13]), emptyAddress);
    });
  });
});
