using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyMvcProject.Data;
using MyMvcProject.Models;

namespace MyMvcProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassroomController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClassroomController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Classroom>>> GetClassrooms()
        {
            return await _context.Classrooms.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Classroom>> CreateClassroom([FromBody] Classroom classroom)
        {
            _context.Classrooms.Add(classroom);
            await _context.SaveChangesAsync();
            return classroom;
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClassroom(int id)
        {
            var classroom = await _context.Classrooms.FindAsync(id);
            if (classroom == null) return NotFound();

            // Xóa tất cả học sinh thuộc lớp này
            var students = _context.Students.Where(s => s.ClassroomId == id);
            _context.Students.RemoveRange(students);

            _context.Classrooms.Remove(classroom);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
