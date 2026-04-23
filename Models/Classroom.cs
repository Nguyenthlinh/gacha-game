using System.ComponentModel.DataAnnotations;

namespace MyMvcProject.Models
{
    public class Classroom
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
    }
}
