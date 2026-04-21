using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyMvcProject.Data;
using MyMvcProject.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyMvcProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GachaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GachaController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("rewards")]
        public async Task<ActionResult<IEnumerable<RewardItem>>> GetRewards()
        {
            return await _context.RewardItems.AsNoTracking().OrderBy(r => r.OrderIndex).ToListAsync();
        }

        [HttpGet("groups")]
        public async Task<ActionResult<IEnumerable<GroupSetting>>> GetGroups()
        {
            return await _context.GroupSettings.AsNoTracking().OrderBy(g => g.Id).ToListAsync();
        }

        [HttpPatch("groups/{id}/rate")]
        public async Task<IActionResult> UpdateGroupProbability(int id, [FromBody] double newRate)
        {
            if (newRate < 0) newRate = 0;
            var group = await _context.GroupSettings.FindAsync(id);
            if (group == null) return NotFound();

            group.Probability = newRate;
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("rewards")]
        public async Task<ActionResult<RewardItem>> AddReward(RewardItem item)
        {
            item.OrderIndex = await _context.RewardItems.CountAsync();
            _context.RewardItems.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetRewards), new { id = item.Id }, item);
        }

        [HttpPost("rewards/bulk")]
        public async Task<IActionResult> AddRewardsBulk([FromBody] List<RewardItem> items)
        {
            if (items == null || !items.Any()) return BadRequest("Danh sách trống.");
            int count = await _context.RewardItems.CountAsync();
            foreach(var item in items) {
                item.OrderIndex = count++;
            }
            _context.RewardItems.AddRange(items);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("rewards/normalize")]
        public async Task<IActionResult> NormalizeRates()
        {
            var rewards = await _context.RewardItems.ToListAsync();
            if (!rewards.Any()) return BadRequest("Không có phần thưởng nào.");

            double totalWeight = rewards.Sum(r => r.DropRate);
            if (totalWeight <= 0) return BadRequest("Tổng tỉ lệ bằng 0, không thể căn chỉnh.");

            foreach (var r in rewards)
            {
                r.DropRate = Math.Round((r.DropRate / totalWeight) * 100, 2);
            }
            
            double newTotal = rewards.Sum(r => r.DropRate);
            if (Math.Abs(100 - newTotal) > 0.001 && rewards.Any())
            {
                rewards.First().DropRate += Math.Round(100 - newTotal, 2);
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("rewards/reorder")]
        public async Task<IActionResult> ReorderRewards([FromBody] List<int> ids)
        {
            var items = await _context.RewardItems.ToListAsync();
            for(int i = 0; i < ids.Count; i++)
            {
                var item = items.FirstOrDefault(x => x.Id == ids[i]);
                if(item != null) item.OrderIndex = i;
            }
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("rewards/{id}")]
        public async Task<IActionResult> DeleteReward(int id)
        {
            var item = await _context.RewardItems.FindAsync(id);
            if (item == null) return NotFound();

            _context.RewardItems.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("rewards/{id}/rate")]
        public async Task<IActionResult> UpdateRate(int id, [FromBody] double newRate)
        {
            if (newRate < 0) newRate = 0;
            var item = await _context.RewardItems.FindAsync(id);
            if (item == null) return NotFound();

            item.DropRate = newRate;
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPatch("rewards/{id}/quantity")]
        public async Task<IActionResult> UpdateQuantity(int id, [FromBody] int newQuantity)
        {
            if (newQuantity < 0) newQuantity = 0;
            var item = await _context.RewardItems.FindAsync(id);
            if (item == null) return NotFound();

            item.Quantity = newQuantity;
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPatch("rewards/{id}/group")]
        public async Task<IActionResult> UpdateGroup(int id, [FromBody] int newGroupId)
        {
            if (newGroupId < 1) newGroupId = 1;
            if (newGroupId > 5) newGroupId = 5;
            
            var item = await _context.RewardItems.FindAsync(id);
            if (item == null) return NotFound();

            item.GroupId = newGroupId;
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("rewards/clear")]
        public async Task<IActionResult> ClearRewards()
        {
            _context.RewardItems.RemoveRange(_context.RewardItems);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        public class BulkActionRequest
        {
            public string Action { get; set; } // "delete" or "move"
            public int TargetGroupId { get; set; }
            public List<int> Ids { get; set; }
        }

        [HttpPost("rewards/bulk-action")]
        public async Task<IActionResult> BulkAction([FromBody] BulkActionRequest request)
        {
            if (request.Ids == null || !request.Ids.Any()) return BadRequest("Danh sách ID trống.");

            var items = await _context.RewardItems.Where(r => request.Ids.Contains(r.Id)).ToListAsync();
            
            if (request.Action == "delete")
            {
                _context.RewardItems.RemoveRange(items);
            }
            else if (request.Action == "move")
            {
                int grp = request.TargetGroupId;
                if (grp < 1) grp = 1;
                if (grp > 5) grp = 5;
                foreach (var item in items)
                {
                    item.GroupId = grp;
                }
            }
            else
            {
                return BadRequest("Hành động không hợp lệ.");
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("roll")]
        public async Task<ActionResult<RewardItem>> RollGacha()
        {
            var rewards = await _context.RewardItems.AsNoTracking().Where(r => r.Quantity > 0).ToListAsync();
            if (!rewards.Any()) return NotFound("Không có phần thưởng nào còn số lượng.");

            double totalWeight = rewards.Sum(r => r.DropRate);
            if (totalWeight <= 0) return NotFound("Chưa thiết lập tỉ lệ phần thưởng.");

            Random rand = new Random();
            double randomValue = rand.NextDouble() * totalWeight;

            double currentWeight = 0;
            foreach (var reward in rewards)
            {
                currentWeight += reward.DropRate;
                if (randomValue <= currentWeight) return Ok(reward);
            }

            return Ok(rewards.Last());
        }

        [HttpGet("cards")]
        public async Task<ActionResult<IEnumerable<RewardItem>>> GetCards()
        {
            var rewards = await _context.RewardItems.AsNoTracking().Where(r => r.Quantity > 0).ToListAsync();
            if (rewards.Count == 0) return NotFound("Không có phần thưởng nào còn số lượng.");

            var selectedCards = new List<RewardItem>();
            Random rand = new Random();

            double totalWeight = rewards.Sum(r => r.DropRate);
            if (totalWeight <= 0) return NotFound("Chưa thiết lập tỉ lệ phần thưởng.");

            for (int i = 0; i < 5; i++)
            {
                double randomValue = rand.NextDouble() * totalWeight;
                double currentWeight = 0;
                foreach (var reward in rewards)
                {
                    currentWeight += reward.DropRate;
                    if (randomValue <= currentWeight)
                    {
                        selectedCards.Add(reward);
                        break;
                    }
                }
            }

            selectedCards = selectedCards.OrderBy(x => rand.Next()).ToList();
            return Ok(selectedCards);
        }
    }
}
