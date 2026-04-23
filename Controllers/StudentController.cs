using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyMvcProject.Data;
using MyMvcProject.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyMvcProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StudentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StudentController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Student>>> GetStudents()
        {
            return await _context.Students.OrderBy(s => s.Name).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Student>> AddStudent(Student student)
        {
            _context.Students.Add(student);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetStudents), new { id = student.Id }, student);
        }

        [HttpPost("bulk")]
        public async Task<IActionResult> BulkAdd([FromBody] List<string> names)
        {
            if (names == null || !names.Any()) return BadRequest();
            
            var newStudents = names.Select(name => new Student { Name = name }).ToList();
            _context.Students.AddRange(newStudents);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("bulk")]
        public async Task<IActionResult> BulkDelete([FromBody] List<int> ids)
        {
            if (ids == null || !ids.Any()) return BadRequest();
            var toDelete = _context.Students.Where(s => ids.Contains(s.Id));
            _context.Students.RemoveRange(toDelete);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("clear-all")]
        public async Task<IActionResult> ClearAll()
        {
            _context.Students.RemoveRange(_context.Students);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPatch("{id}/stickers")]
        public async Task<IActionResult> UpdateStickers(int id, [FromBody] int amount)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null) return NotFound();

            student.Stickers += amount;
            if (student.Stickers < 0) student.Stickers = 0;

            await _context.SaveChangesAsync();
            return Ok(student);
        }

        [HttpPost("{id}/redeem")]
        public async Task<IActionResult> RedeemGift(int id, [FromBody] int cost)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null) return NotFound();

            if (student.Stickers < cost) return BadRequest("Không đủ Sticker");

            student.Stickers -= cost;
            await _context.SaveChangesAsync();
            return Ok(student);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null) return NotFound();

            _context.Students.Remove(student);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
