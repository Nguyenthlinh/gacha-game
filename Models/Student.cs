using System.ComponentModel.DataAnnotations;

namespace MyMvcProject.Models
{
    public class Student
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public int Stickers { get; set; } = 0;

        public string ClassName { get; set; } = "Lớp 1"; // Mặc định
    }
}
