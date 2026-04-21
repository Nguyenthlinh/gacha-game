using System.ComponentModel.DataAnnotations;

namespace MyMvcProject.Models
{
    public class RewardItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        // Tỉ lệ rớt (%)
        [Range(0, 1000)]
        public double DropRate { get; set; } = 10;

        public int OrderIndex { get; set; } = 0;
        public int Quantity { get; set; } = 10;
        public int GroupId { get; set; } = 1; // 1: Cơ bản, 2: Tạm ổn, 3: Khá ngon, 4: Xịn xò, 5: VIP
    }
}
