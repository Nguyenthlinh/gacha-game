using Microsoft.EntityFrameworkCore;
using MyMvcProject.Models;

namespace MyMvcProject.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<RewardItem> RewardItems { get; set; }
        public DbSet<RewardHistoryItem> RewardHistory { get; set; }
        public DbSet<GroupSetting> GroupSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            modelBuilder.Entity<GroupSetting>().HasData(
                new GroupSetting { Id = 1, Probability = 50 },
                new GroupSetting { Id = 2, Probability = 25 },
                new GroupSetting { Id = 3, Probability = 15 },
                new GroupSetting { Id = 4, Probability = 8 },
                new GroupSetting { Id = 5, Probability = 2 }
            );
        }
    }
}
