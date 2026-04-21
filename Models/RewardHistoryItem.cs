using System;
using System.ComponentModel.DataAnnotations;

namespace MyMvcProject.Models
{
    public class RewardHistoryItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string RewardName { get; set; } = string.Empty;

        public DateTime ReceivedAt { get; set; } = DateTime.Now;

        [Required]
        public string Source { get; set; } = string.Empty;
    }
}
