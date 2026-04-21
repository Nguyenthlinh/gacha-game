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
    public class HistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HistoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RewardHistoryItem>>> GetHistory()
        {
            return await _context.RewardHistory.AsNoTracking().OrderByDescending(h => h.ReceivedAt).ToListAsync();
        }

        [HttpPost]
        public async Task<IActionResult> AddHistory([FromBody] RewardHistoryItem item)
        {
            if (string.IsNullOrEmpty(item.RewardName) || string.IsNullOrEmpty(item.Source))
                return BadRequest();

            // Giảm số lượng phần quà
            var reward = await _context.RewardItems.FirstOrDefaultAsync(r => r.Name == item.RewardName);
            if (reward != null && reward.Quantity > 0)
            {
                reward.Quantity--;
            }

            item.ReceivedAt = DateTime.UtcNow;
            _context.RewardHistory.Add(item);
            
            // Auto-clean: Chỉ giữ 500 bản ghi lịch sử mới nhất để không tốn bộ nhớ DB (Neon Free limit 500MB)
            var historyCount = await _context.RewardHistory.CountAsync();
            if (historyCount > 500)
            {
                var oldRecords = await _context.RewardHistory
                    .OrderBy(h => h.ReceivedAt)
                    .Take(historyCount - 499)
                    .ToListAsync();
                _context.RewardHistory.RemoveRange(oldRecords);
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearHistory()
        {
            _context.RewardHistory.RemoveRange(_context.RewardHistory);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
